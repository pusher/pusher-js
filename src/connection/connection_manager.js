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
   * - disconnected - on requested disconnection or before reconnecting
   * - unavailable - after connection timeout or when there's no network
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
    this.timeline = this.options.getTimeline();

    this.connectionCallbacks = this.buildCallbacks();

    var self = this;

    Pusher.Network.bind("online", function() {
      if (self.state === "unavailable") {
        self.connect();
      }
    });
    Pusher.Network.bind("offline", function() {
      if (self.shouldRetry()) {
        self.disconnect();
        self.updateState("unavailable");
      }
    });

    var sendTimeline = function() {
      if (self.timelineSender) {
        self.timelineSender.send(function() {});
      }
    };
    this.bind("connected", sendTimeline);
    setInterval(sendTimeline, 60000);

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
    if (this.connection) {
      return;
    }
    if (this.state === "connecting") {
      return;
    }

    if (!this.strategy.isSupported()) {
      this.updateState("failed");
      return;
    }
    if (Pusher.Network.isOnline() === false) {
      this.updateState("unavailable");
      return;
    }

    this.updateState("connecting");
    this.timelineSender = this.options.getTimelineSender(
      this.timeline,
      { encrypted: this.encrypted },
      this
    );

    var self = this;
    var callback = function(error, transport) {
      if (error) {
        self.runner = self.strategy.connect(0, callback);
      } else {
        // we don't support switching connections yet
        self.runner.abort();
        self.setConnection(self.wrapTransport(transport));
      }
    };
    this.runner = this.strategy.connect(0, callback);

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
    if (this.runner) {
      this.runner.abort();
    }
    this.clearRetryTimer();
    this.clearUnavailableTimer();
    this.stopActivityCheck();
    this.updateState("disconnected");
    // we're in disconnected state, so closing will not cause reconnecting
    if (this.connection) {
      this.connection.close();
      this.abandonConnection();
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
    this.retryTimer = setTimeout(function() {
      if (self.retryTimer === null) {
        return;
      }
      self.retryTimer = null;
      self.disconnect();
      self.connect();
    }, delay || 0);
  };

  /** @private */
  prototype.clearRetryTimer = function() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  };

  /** @private */
  prototype.setUnavailableTimer = function() {
    var self = this;
    this.unavailableTimer = setTimeout(function() {
      if (!self.unavailableTimer) {
        return;
      }
      self.updateState("unavailable");
      self.unavailableTimer = null;
    }, this.options.unavailableTimeout);
  };

  /** @private */
  prototype.clearUnavailableTimer = function() {
    if (this.unavailableTimer) {
      clearTimeout(this.unavailableTimer);
      this.unavailableTimer = null;
    }
  };

  /** @private */
  prototype.resetActivityCheck = function() {
    this.stopActivityCheck();
    // send ping after inactivity
    if (!this.connection.supportsPing()) {
      var self = this;
      this.activityTimer = setTimeout(function() {
        self.send_event('pusher:ping', {});
        // wait for pong response
        self.activityTimer = setTimeout(function() {
          self.connection.close();
        }, (self.options.pongTimeout));
      }, (this.options.activityTimeout));
    }
  };

  /** @private */
  prototype.stopActivityCheck = function() {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  };

  /** @private */
  prototype.buildCallbacks = function() {
    var self = this;
    return {
      connected: function(id) {
        self.clearUnavailableTimer();
        self.socket_id = id;
        self.updateState("connected");
        self.resetActivityCheck();
      },
      message: function(message) {
        // includes pong messages from server
        self.resetActivityCheck();
        self.emit('message', message);
      },
      ping: function() {
        self.send_event('pusher:pong', {});
      },
      ping_request: function() {
        self.send_event('pusher:ping', {});
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
      },
      ssl_only: function() {
        self.encrypted = true;
        self.updateStrategy();
        self.retryIn(0);
      },
      refused: function() {
        self.disconnect();
      },
      backoff: function() {
        self.retryIn(1000);
      },
      retry: function() {
        self.retryIn(0);
      }
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
    for (var event in this.connectionCallbacks) {
      this.connection.unbind(event, this.connectionCallbacks[event]);
    }
    this.connection = null;
  };

  /** @private */
  prototype.updateState = function(newState, data) {
    var previousState = this.state;

    this.state = newState;
    // Only emit when the state changes
    if (previousState !== newState) {
      Pusher.debug('State changed', previousState + ' -> ' + newState);

      this.emit('state_change', { previous: previousState, current: newState });
      this.emit(newState, data);
    }
  };

  /** @private */
  prototype.shouldRetry = function() {
    return this.state === "connecting" || this.state === "connected";
  };

  /** @private */
  prototype.wrapTransport = function(transport) {
    return new Pusher.ProtocolWrapper(transport);
  };

  Pusher.ConnectionManager = ConnectionManager;
}).call(this);
