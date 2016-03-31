import {default as EventsDispatcher} from '../events/dispatcher';
import {OneOffTimer as Timer} from '../utils/timers';
import {Network} from 'net_info';
import Logger from '../logger';
import ConnectionState from './state';
import HandshakePayload from './handshake/handshake_payload';
import Connection from "./connection";
import Strategy from "../strategies/strategy";
import StrategyRunner from "../strategies/strategy_runner";
import * as Collections from "../utils/collections";

/** Manages connection to Pusher.
 *
 * Uses a strategy (currently only default), timers and network availability
 * info to establish a connection and export its state. In case of failures,
 * manages reconnection attempts.
 *
 * Exports state changes as following events:
 * - "state_change", { previous: p, current: state }
 * - state
 *
 * States:
 * - initialized - initial state, never transitioned to
 * - connecting - connection is being established
 * - connected - connection has been fully established
 * - disconnected - on requested disconnection
 * - unavailable - after connection timeout or when there's no network
 * - failed - when the connection strategy is not supported
 *
 * Options:
 * - unavailableTimeout - time to transition to unavailable state
 * - activityTimeout - time after which ping message should be sent
 * - pongTimeout - time for Pusher to respond with pong before reconnecting
 *
 * @param {String} key application key
 * @param {Object} options
 */
export default class ConnectionManager extends EventsDispatcher {
  key : string;
  options: any;
  state: ConnectionState;
  connection: Connection;
  encrypted: boolean;
  timeline: any;
  socket_id: string;
  unavailableTimer: Timer;
  activityTimer: Timer;
  retryTimer: Timer;
  activityTimeout: number;
  strategy: Strategy;
  runner: StrategyRunner;
  errorCallbacks: any;
  handshakeCallbacks: any;
  connectionCallbacks: any;

  constructor(key : string, options : any) {
    super();
    this.key = key;
    this.options = options || {};
    this.state = ConnectionState.INITIALIZED;
    this.connection = null;
    this.encrypted = !!options.encrypted;
    this.timeline = this.options.timeline;

    this.connectionCallbacks = this.buildConnectionCallbacks();
    this.errorCallbacks = this.buildErrorCallbacks();
    this.handshakeCallbacks = this.buildHandshakeCallbacks(this.errorCallbacks);

    var self = this;

    Network.bind("online", function() {
      self.timeline.info({ netinfo: "online" });
      if (<any>(self.state) === "connecting" || <any>(self.state) === "unavailable") {
        self.retryIn(0);
      }
    });
    Network.bind("offline", function() {
      self.timeline.info({ netinfo: "offline" });
      if (self.connection) {
        self.sendActivityCheck();
      }
    });

    this.updateStrategy();
  }

  /** Establishes a connection to Pusher.
   *
   * Does nothing when connection is already established. See top-level doc
   * to find events emitted on connection attempts.
   */
  connect() {
    if (this.connection || this.runner) {
      return;
    }
    if (!this.strategy.isSupported()) {
      this.updateState(ConnectionState.FAILED);
      return;
    }
    this.updateState(ConnectionState.CONNECTING);
    this.startConnecting();
    this.setUnavailableTimer();
  };

  /** Sends raw data.
   *
   * @param {String} data
   */
  send(data) {
    if (this.connection) {
      return this.connection.send(data);
    } else {
      return false;
    }
  };

  /** Sends an event.
   *
   * @param {String} name
   * @param {String} data
   * @param {String} [channel]
   * @returns {Boolean} whether message was sent or not
   */
  send_event(name : string, data : any, channel?: string) {
    if (this.connection) {
      return this.connection.send_event(name, data, channel);
    } else {
      return false;
    }
  };

  /** Closes the connection. */
  disconnect() {
    this.disconnectInternally();
    this.updateState(ConnectionState.DISCONNECTED);
  };

  isEncrypted() {
    return this.encrypted;
  };

  /** @private */
  startConnecting() {
    var self = this;
    var callback = function(error, handshake) {
      if (error) {
        self.runner = self.strategy.connect(0, callback);
      } else {
        if (handshake.action === "error") {
          self.emit("error", { type: "HandshakeError", error: handshake.error });
          self.timeline.error({ handshakeError: handshake.error });
        } else {
          self.abortConnecting(); // we don't support switching connections yet
          self.handshakeCallbacks[handshake.action](handshake);
        }
      }
    };
    self.runner = self.strategy.connect(0, callback);
  };

  /** @private */
  abortConnecting() {
    if (this.runner) {
      this.runner.abort();
      this.runner = null;
    }
  };

  /** @private */
  disconnectInternally() {
    this.abortConnecting();
    this.clearRetryTimer();
    this.clearUnavailableTimer();
    if (this.connection) {
      var connection = this.abandonConnection();
      connection.close();
    }
  };

  /** @private */
  updateStrategy() {
    this.strategy = this.options.getStrategy({
      key: this.key,
      timeline: this.timeline,
      encrypted: this.encrypted
    });
  };

  /** @private */
  retryIn(delay) {
    var self = this;
    self.timeline.info({ action: "retry", delay: delay });
    if (delay > 0) {
      self.emit("connecting_in", Math.round(delay / 1000));
    }
    self.retryTimer = new Timer(delay || 0, function() {
      self.disconnectInternally();
      self.connect();
    });
  };

  /** @private */
  clearRetryTimer() {
    if (this.retryTimer) {
      this.retryTimer.ensureAborted();
      this.retryTimer = null;
    }
  };

  /** @private */
  setUnavailableTimer() {
    var self = this;
    self.unavailableTimer = new Timer(
      self.options.unavailableTimeout,
      function() {
        self.updateState(ConnectionState.UNAVAILABLE);
      }
    );
  };

  /** @private */
  clearUnavailableTimer() {
    if (this.unavailableTimer) {
      this.unavailableTimer.ensureAborted();
    }
  };

  /** @private */
  sendActivityCheck() {
    var self = this;
    self.stopActivityCheck();
    self.connection.ping();
    // wait for pong response
    self.activityTimer = new Timer(
      self.options.pongTimeout,
      function() {
        self.timeline.error({ pong_timed_out: self.options.pongTimeout });
        self.retryIn(0);
      }
    );
  };

  /** @private */
  resetActivityCheck() {
    var self = this;
    self.stopActivityCheck();
    // send ping after inactivity
    if (!self.connection.handlesActivityChecks()) {
      self.activityTimer = new Timer(self.activityTimeout, function() {
        self.sendActivityCheck();
      });
    }
  };

  /** @private */
  stopActivityCheck() {
    if (this.activityTimer) {
      this.activityTimer.ensureAborted();
    }
  };

  /** @private */
  buildConnectionCallbacks() {
    var self = this;
    return {
      message: function(message) {
        // includes pong messages from server
        self.resetActivityCheck();
        self.emit('message', message);
      },
      ping: function() {
        self.send_event('pusher:pong', {});
      },
      activity: function() {
        self.resetActivityCheck();
      },
      error: function(error) {
        // just emit error to user - socket will already be closed by browser
        self.emit("error", { type: "WebSocketError", error: error });
      },
      closed: function() {
        self.abandonConnection();
        if (self.shouldRetry()) {
          self.retryIn(1000);
        }
      }
    };
  };

  /** @private */
  buildHandshakeCallbacks(errorCallbacks) {
    var self = this;
    return Collections.extend({}, errorCallbacks, {
      connected: function(handshake : HandshakePayload) {
        self.activityTimeout = Math.min(
          self.options.activityTimeout,
          handshake.activityTimeout,
          handshake.connection.activityTimeout || Infinity
        );
        self.clearUnavailableTimer();
        self.setConnection(handshake.connection);
        self.socket_id = self.connection.id;
        self.updateState(ConnectionState.CONNECTED, { socket_id: self.socket_id });
      }
    });
  };

  /** @private */
  buildErrorCallbacks() {
    var self = this;

    function withErrorEmitted(callback) {
      return function(result) {
        if (result.error) {
          self.emit("error", { type: "WebSocketError", error: result.error });
        }
        callback(result);
      };
    }

    return {
      ssl_only: withErrorEmitted(function() {
        self.encrypted = true;
        self.updateStrategy();
        self.retryIn(0);
      }),
      refused: withErrorEmitted(function() {
        self.disconnect();
      }),
      backoff: withErrorEmitted(function() {
        self.retryIn(1000);
      }),
      retry: withErrorEmitted(function() {
        self.retryIn(0);
      })
    };
  };

  /** @private */
  setConnection(connection) {
    this.connection = connection;
    for (var event in this.connectionCallbacks) {
      this.connection.bind(event, this.connectionCallbacks[event]);
    }
    this.resetActivityCheck();
  };

  /** @private */
  abandonConnection() {
    if (!this.connection) {
      return;
    }
    this.stopActivityCheck();
    for (var event in this.connectionCallbacks) {
      this.connection.unbind(event, this.connectionCallbacks[event]);
    }
    var connection = this.connection;
    this.connection = null;
    return connection;
  }

  /** @private */
  updateState(newState : ConnectionState, data?: any) {
    var previousState = this.state;
    this.state = newState;
    if (previousState !== newState) {
      var newStateDescription = <any> newState;
      if (newStateDescription === "connected") {
        newStateDescription += " with new socket ID " + data.socket_id;
      }
      Logger.debug('State changed', previousState + ' -> ' + newStateDescription);
      this.timeline.info({ state: newState, params: data });
      this.emit('state_change', { previous: previousState, current: newState });
      this.emit(<any>newState, data);
    }
  }

  /** @private */
  shouldRetry() : boolean {
    return <any>(this.state) === "connecting" || <any>(this.state) === "connected";
  }

}
