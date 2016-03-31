import Util from 'core/util';
import * as Collections from 'core/utils/collections';
import {default as EventsDispatcher} from "core/events/dispatcher";
import Logger from 'core/logger';
import ConnectionState from 'core/connection/state';
import TransportHooks from 'core/transports/transport_hooks';
import Socket from 'core/socket';

/** Provides universal API for transport connections.
 *
 * Transport connection is a low-level object that wraps a connection method
 * and exposes a simple evented interface for the connection state and
 * messaging. It does not implement Pusher-specific WebSocket protocol.
 *
 * Additionally, it fetches resources needed for transport to work and exposes
 * an interface for querying transport features.
 *
 * States:
 * - new - initial state after constructing the object
 * - initializing - during initialization phase, usually fetching resources
 * - intialized - ready to establish a connection
 * - connection - when connection is being established
 * - open - when connection ready to be used
 * - closed - after connection was closed be either side
 *
 * Emits:
 * - error - after the connection raised an error
 *
 * Options:
 * - encrypted - whether connection should use ssl
 * - hostEncrypted - host to connect to when connection is encrypted
 * - hostUnencrypted - host to connect to when connection is not encrypted
 *
 * @param {String} key application key
 * @param {Object} options
 */
export default class IsomorphicTransportConnection extends EventsDispatcher {
  hooks: TransportHooks;
  name: string;
  priority: number;
  key: string;
  options: any;
  state: ConnectionState;
  timeline: any;
  activityTimeout: number;
  id: string;
  socket: Socket;
  beforeOpen: Function;

  constructor(hooks : TransportHooks, name : string, priority : number, key : string, options : any) {
    super();
    this.hooks = hooks;
    this.name = name;
    this.priority = priority;
    this.key = key;
    this.options = options;

    this.state = ConnectionState.NEW;
    this.timeline = options.timeline;
    this.activityTimeout = options.activityTimeout;
    this.id = this.timeline.generateUniqueID();
  }

  /** Checks whether the transport handles activity checks by itself.
   *
   * @return {Boolean}
   */
  handlesActivityChecks() : boolean {
    return Boolean(this.hooks.handlesActivityChecks);
  }

  /** Checks whether the transport supports the ping/pong API.
   *
   * @return {Boolean}
   */
  supportsPing() : boolean {
    return Boolean(this.hooks.supportsPing);
  }

  /** Initializes the transport.
   *
   * Fetches resources if needed and then transitions to initialized.
   */
  initialize() {
    var self = this;

    self.timeline.info(self.buildTimelineMessage({
      transport: self.name + (self.options.encrypted ? "s" : "")
    }));

    if (self.hooks.isInitialized()) {
      self.changeState(ConnectionState.INITIALIZED);
    } else {
      self.onClose();
    }
  }

  /** Tries to establish a connection.
   *
   * @returns {Boolean} false if transport is in invalid state
   */
  connect() : boolean {
    var self = this;

    if (self.socket || self.state !== <any>ConnectionState.INITIALIZED) {
      return false;
    }

    var url = self.hooks.urls.getInitial(self.key, self.options);
    try {
      self.socket = self.hooks.getSocket(url, self.options);
    } catch (e) {
      Util.defer(function() {
        self.onError(e);
        self.changeState(ConnectionState.CLOSED);
      });
      return false;
    }

    self.bindListeners();

    Logger.debug("Connecting", { transport: self.name, url: url });
    self.changeState(ConnectionState.CONNECTING);
    return true;
  }

  /** Closes the connection.
   *
   * @return {Boolean} true if there was a connection to close
   */
  close() : boolean {
    if (this.socket) {
      this.socket.close();
      return true;
    } else {
      return false;
    }
  }

  /** Sends data over the open connection.
   *
   * @param {String} data
   * @return {Boolean} true only when in the "open" state
   */
  send(data : any) : boolean {
    var self = this;

    if (self.state === <any>ConnectionState.OPEN) {
      // Workaround for MobileSafari bug (see https://gist.github.com/2052006)
      Util.defer(function() {
        if (self.socket) {
          self.socket.send(data);
        }
      });
      return true;
    } else {
      return false;
    }
  }

  /** Sends a ping if the connection is open and transport supports it. */
  ping() {
    if (this.state === <any>ConnectionState.OPEN && this.supportsPing()) {
      this.socket.ping();
    }
  }

  /** @private */
  onOpen() {
    if (this.hooks.beforeOpen) {
      this.hooks.beforeOpen(
        this.socket, this.hooks.urls.getPath(this.key, this.options)
      );
    }
    this.changeState(ConnectionState.OPEN);
    this.socket.onopen = undefined;
  }

  /** @private */
  onError(error) {
    this.emit("error", { type: 'WebSocketError', error: error });
    this.timeline.error(this.buildTimelineMessage({ error: error.toString() }));
  }

  /** @private */
  onClose(closeEvent?:any) {
    if (closeEvent) {
      this.changeState(ConnectionState.CLOSED, {
        code: closeEvent.code,
        reason: closeEvent.reason,
        wasClean: closeEvent.wasClean
      });
    } else {
      this.changeState(ConnectionState.CLOSED);
    }
    this.unbindListeners();
    this.socket = undefined;
  }

  /** @private */
  onMessage(message) {
    this.emit("message", message);
  }

  /** @private */
  onActivity() {
    this.emit("activity");
  }

  /** @private */
  bindListeners() {
    var self = this;

    self.socket.onopen = function() {
      self.onOpen();
    };
    self.socket.onerror = function(error) {
      self.onError(error);
    };
    self.socket.onclose = function(closeEvent) {
      self.onClose(closeEvent);
    };
    self.socket.onmessage = function(message) {
      self.onMessage(message);
    };

    if (self.supportsPing()) {
      self.socket.onactivity = function() { self.onActivity(); };
    }
  }

  /** @private */
  unbindListeners() {
    if (this.socket) {
      this.socket.onopen = undefined;
      this.socket.onerror = undefined;
      this.socket.onclose = undefined;
      this.socket.onmessage = undefined;
      if (this.supportsPing()) {
        this.socket.onactivity = undefined;
      }
    }
  }

  /** @private */
  changeState(state : ConnectionState, params?:any) {
    this.state = state;
    this.timeline.info(this.buildTimelineMessage({
      state: state,
      params: params
    }));
    this.emit(<any>state, params);
  }

  buildTimelineMessage(message) : any {
    return Collections.extend({ cid: this.id }, message);
  }

}
