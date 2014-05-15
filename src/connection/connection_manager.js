;(function() {
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
  function ConnectionManager(key, options) {
    Pusher.EventsDispatcher.call(this);

    this.key = key;
    this.options = options || {};
    this.state = "initialized";
    this.connection = null;
    this.encrypted = !!options.encrypted;
    this.timeline = this.options.timeline;

    this.connectionCallbacks = this.buildConnectionCallbacks();
    this.errorCallbacks = this.buildErrorCallbacks();
    this.handshakeCallbacks = this.buildHandshakeCallbacks(this.errorCallbacks);

    var self = this;

    Pusher.Network.bind("online", function() {
      self.timeline.info({ netinfo: "online" });
      if (self.state === "connecting" || self.state === "unavailable") {
        self.retryIn(0);
      }
    });
    Pusher.Network.bind("offline", function() {
      self.timeline.info({ netinfo: "offline" });
      if (self.connection) {
        self.sendActivityCheck();
      }
    });

    this.updateStrategy();
  }
  var prototype = ConnectionManager.prototype;

  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  /** Establishes a connection to Pusher.
   *
   * Does nothing when connection is already established. See top-level doc
   * to find events emitted on connection attempts.
   */
  prototype.connect = function() {
    if (this.connection || this.runner) {
      return;
    }
    if (!this.strategy.isSupported()) {
      this.updateState("failed");
      return;
    }
    this.updateState("connecting");
    this.startConnecting();
    this.setUnavailableTimer();
  };

  /** Sends raw data.
   *
   * @param {String} data
   */
  prototype.send = function(data) {
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
  prototype.send_event = function(name, data, channel) {
    if (this.connection) {
      return this.connection.send_event(name, data, channel);
    } else {
      return false;
    }
  };

  /** Closes the connection. */
  prototype.disconnect = function() {
    this.disconnectInternally();
    this.updateState("disconnected");
  };

  prototype.isEncrypted = function() {
    return this.encrypted;
  };

  /** @private */
  prototype.startConnecting = function() {
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
  prototype.abortConnecting = function() {
    if (this.runner) {
      this.runner.abort();
      this.runner = null;
    }
  };

  /** @private */
  prototype.disconnectInternally = function() {
    this.abortConnecting();
    this.clearRetryTimer();
    this.clearUnavailableTimer();
    if (this.connection) {
      var connection = this.abandonConnection();
      connection.close();
    }
  };

  /** @private */
  prototype.updateStrategy = function() {
    this.strategy = this.options.getStrategy({
      key: this.key,
      timeline: this.timeline,
      encrypted: this.encrypted
    });
  };

  /** @private */
  prototype.retryIn = function(delay) {
    var self = this;
    self.timeline.info({ action: "retry", delay: delay });
    if (delay > 0) {
      self.emit("connecting_in", Math.round(delay / 1000));
    }
    self.retryTimer = new Pusher.Timer(delay || 0, function() {
      self.disconnectInternally();
      self.connect();
    });
  };

  /** @private */
  prototype.clearRetryTimer = function() {
    if (this.retryTimer) {
      this.retryTimer.ensureAborted();
      this.retryTimer = null;
    }
  };

  /** @private */
  prototype.setUnavailableTimer = function() {
    var self = this;
    self.unavailableTimer = new Pusher.Timer(
      self.options.unavailableTimeout,
      function() {
        self.updateState("unavailable");
      }
    );
  };

  /** @private */
  prototype.clearUnavailableTimer = function() {
    if (this.unavailableTimer) {
      this.unavailableTimer.ensureAborted();
    }
  };

  /** @private */
  prototype.sendActivityCheck = function() {
    var self = this;
    self.stopActivityCheck();
    self.connection.ping();
    // wait for pong response
    self.activityTimer = new Pusher.Timer(
      self.options.pongTimeout,
      function() {
        self.timeline.error({ pong_timed_out: self.options.pongTimeout });
        self.retryIn(0);
      }
    );
  };

  /** @private */
  prototype.resetActivityCheck = function() {
    var self = this;
    self.stopActivityCheck();
    // send ping after inactivity
    if (!self.connection.handlesActivityChecks()) {
      self.activityTimer = new Pusher.Timer(self.activityTimeout, function() {
        self.sendActivityCheck();
      });
    }
  };

  /** @private */
  prototype.stopActivityCheck = function() {
    if (this.activityTimer) {
      this.activityTimer.ensureAborted();
    }
  };

  /** @private */
  prototype.buildConnectionCallbacks = function() {
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
  prototype.buildHandshakeCallbacks = function(errorCallbacks) {
    var self = this;
    return Pusher.Util.extend({}, errorCallbacks, {
      connected: function(handshake) {
        self.activityTimeout = Math.min(
          self.options.activityTimeout,
          handshake.activityTimeout,
          handshake.connection.activityTimeout || Infinity
        );
        self.clearUnavailableTimer();
        self.setConnection(handshake.connection);
        self.socket_id = self.connection.id;
        self.updateState("connected", { socket_id: self.socket_id });
      }
    });
  };

  /** @private */
  prototype.buildErrorCallbacks = function() {
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
  prototype.setConnection = function(connection) {
    this.connection = connection;
    for (var event in this.connectionCallbacks) {
      this.connection.bind(event, this.connectionCallbacks[event]);
    }
    this.resetActivityCheck();
  };

  /** @private */
  prototype.abandonConnection = function() {
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
  };

  /** @private */
  prototype.updateState = function(newState, data) {
    var previousState = this.state;
    this.state = newState;
    if (previousState !== newState) {
      Pusher.debug('State changed', previousState + ' -> ' + newState);
      this.timeline.info({ state: newState, params: data });
      this.emit('state_change', { previous: previousState, current: newState });
      this.emit(newState, data);
    }
  };

  /** @private */
  prototype.shouldRetry = function() {
    return this.state === "connecting" || this.state === "connected";
  };

  Pusher.ConnectionManager = ConnectionManager;
}).call(this);
