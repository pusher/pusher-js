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

    var strategy = this.options.getStrategy({
      key: this.key,
      timeline: this.timeline,
      encrypted: this.encrypted
    });

    if (!strategy.isSupported()) {
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
        self.runner = strategy.connect(0, callback);
      } else {
        // we don't support switching connections yet
        self.runner.abort();
        self.setConnection(self.wrapTransport(transport));
      }
    };
    this.runner = strategy.connect(0, callback);

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
      this.connection = null;
    }
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
  prototype.setConnection = function(connection) {
    this.connection = connection;

    var self = this;
    var onConnected = function(id) {
      self.clearUnavailableTimer();
      self.socket_id = id;
      self.updateState("connected");
      self.resetActivityCheck();
    };
    var onMessage = function(message) {
      // includes pong messages from server
      self.resetActivityCheck();
      self.emit('message', message);
    };
    var onPing = function() {
      self.send_event('pusher:pong', {});
    };
    var onError = function(error) {
      // just emit error to user - socket will already be closed by browser
      self.emit("error", { type: "WebSocketError", error: error });
    };
    var onClosed = function() {
      connection.unbind("connected", onConnected);
      connection.unbind("message", onMessage);
      connection.unbind("ping", onPing);
      connection.unbind("error", onError);
      connection.unbind("closed", onClosed);
      self.connection = null;

      if (self.shouldRetry()) {
        self.retryIn(1000);
      }
    };

    // handling close conditions
    var onSSLOnly = function() {
      self.encrypted = true;
      self.retryIn(0);
    };
    var onRefused = function() {
      self.disconnect();
    };
    var onBackoff = function() {
      self.retryIn(1000);
    };
    var onRetry = function() {
      self.retryIn(0);
    };

    connection.bind("connected", onConnected);
    connection.bind("message", onMessage);
    connection.bind("ping", onPing);
    connection.bind("error", onError);
    connection.bind("closed", onClosed);

    connection.bind("ssl_only", onSSLOnly);
    connection.bind("refused", onRefused);
    connection.bind("backoff", onBackoff);
    connection.bind("retry", onRetry);

    this.resetActivityCheck();
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
