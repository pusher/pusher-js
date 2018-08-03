import Util from '../util';
import * as Collections from '../utils/collections';
import {default as EventsDispatcher} from "../events/dispatcher";
import Logger from '../logger';
import TransportHooks from './transport_hooks';
import Socket from '../socket';
import Runtime from 'runtime';
import Timeline from '../timeline/timeline';
import TransportConnectionOptions from './transport_connection_options';

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
 * - useTLS - whether connection should be over TLS
 * - hostTLS - host to connect to when connection is over TLS
 * - hostNonTLS - host to connect to when connection is over TLS
 *
 * @param {String} key application key
 * @param {Object} options
 */
export default class TransportConnection extends EventsDispatcher {
  hooks: TransportHooks;
  name: string;
  priority: number;
  key: string;
  options: TransportConnectionOptions;
  state: string;
  timeline: Timeline;
  activityTimeout: number;
  id: number;
  socket: Socket;
  beforeOpen: Function;
  initialize: Function;

  constructor(hooks : TransportHooks, name : string, priority : number, key : string, options : TransportConnectionOptions) {
    super();
    this.initialize = Runtime.transportConnectionInitializer;
    this.hooks = hooks;
    this.name = name;
    this.priority = priority;
    this.key = key;
    this.options = options;

    this.state = "new";
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

  /** Tries to establish a connection.
   *
   * @returns {Boolean} false if transport is in invalid state
   */
  connect() : boolean {
    if (this.socket || this.state !== "initialized") {
      return false;
    }

    var url = this.hooks.urls.getInitial(this.key, this.options);
    try {
      this.socket = this.hooks.getSocket(url, this.options);
    } catch (e) {
      Util.defer(()=> {
        this.onError(e);
        this.changeState("closed");
      });
      return false;
    }

    this.bindListeners();

    Logger.debug("Connecting", { transport: this.name, url});
    this.changeState("connecting");
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
    if (this.state === "open") {
      // Workaround for MobileSafari bug (see https://gist.github.com/2052006)
      Util.defer(()=> {
        if (this.socket) {
          this.socket.send(data);
        }
      });
      return true;
    } else {
      return false;
    }
  }

  /** Sends a ping if the connection is open and transport supports it. */
  ping() {
    if (this.state === "open" && this.supportsPing()) {
      this.socket.ping();
    }
  }

  private onOpen() {
    if (this.hooks.beforeOpen) {
      this.hooks.beforeOpen(
        this.socket, this.hooks.urls.getPath(this.key, this.options)
      );
    }
    this.changeState("open");
    this.socket.onopen = undefined;
  }

  private onError(error) {
    this.emit("error", { type: 'WebSocketError', error: error });
    this.timeline.error(this.buildTimelineMessage({ error: error.toString() }));
  }

  private onClose(closeEvent?:any) {
    if (closeEvent) {
      this.changeState("closed", {
        code: closeEvent.code,
        reason: closeEvent.reason,
        wasClean: closeEvent.wasClean
      });
    } else {
      this.changeState("closed");
    }
    this.unbindListeners();
    this.socket = undefined;
  }

  private onMessage(message) {
    this.emit("message", message);
  }

  private onActivity() {
    this.emit("activity");
  }

  private bindListeners() {
    this.socket.onopen = ()=> {
      this.onOpen();
    };
    this.socket.onerror = (error) => {
      this.onError(error);
    };
    this.socket.onclose = (closeEvent) => {
      this.onClose(closeEvent);
    };
    this.socket.onmessage = (message) => {
      this.onMessage(message);
    };

    if (this.supportsPing()) {
      this.socket.onactivity = ()=> { this.onActivity(); };
    }
  }

  private unbindListeners() {
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

  private changeState(state : string, params?:any) {
    this.state = state;
    this.timeline.info(this.buildTimelineMessage({
      state: state,
      params: params
    }));
    this.emit(state, params);
  }

  buildTimelineMessage(message) : any {
    return Collections.extend({ cid: this.id }, message);
  }

}
