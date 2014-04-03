(function() {
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
  function TransportConnection(hooks, name, priority, key, options) {
    Pusher.EventsDispatcher.call(this);

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
  var prototype = TransportConnection.prototype;
  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  /** Checks whether the transport handles activity checks by itself.
   *
   * @return {Boolean}
   */
  prototype.handlesActivityChecks = function() {
    return Boolean(this.hooks.handlesActivityChecks);
  };

  /** Checks whether the transport supports the ping/pong API.
   *
   * @return {Boolean}
   */
  prototype.supportsPing = function() {
    return Boolean(this.hooks.supportsPing);
  };

  /** Initializes the transport.
   *
   * Fetches resources if needed and then transitions to initialized.
   */
  prototype.initialize = function() {
    var self = this;

    self.timeline.info(self.buildTimelineMessage({
      transport: self.name + (self.options.encrypted ? "s" : "")
    }));

    if (self.hooks.beforeInitialize) {
      self.hooks.beforeInitialize();
    }

    if (self.hooks.isInitialized()) {
      self.changeState("initialized");
    } else if (self.hooks.file) {
      self.changeState("initializing");
      Pusher.Dependencies.load(self.hooks.file, function(error, callback) {
        if (self.hooks.isInitialized()) {
          self.changeState("initialized");
          callback(true);
        } else {
          if (error) {
            self.onError(error);
          }
          self.onClose();
          callback(false);
        }
      });
    } else {
      self.onClose();
    }
  };

  /** Tries to establish a connection.
   *
   * @returns {Boolean} false if transport is in invalid state
   */
  prototype.connect = function() {
    var self = this;

    if (self.socket || self.state !== "initialized") {
      return false;
    }

    var url = self.hooks.urls.getInitial(self.key, self.options);
    try {
      self.socket = self.hooks.getSocket(url, self.options);
    } catch (e) {
      Pusher.Util.defer(function() {
        self.onError(e);
        self.changeState("closed");
      });
      return false;
    }

    self.bindListeners();

    Pusher.debug("Connecting", { transport: self.name, url: url });
    self.changeState("connecting");
    return true;
  };

  /** Closes the connection.
   *
   * @return {Boolean} true if there was a connection to close
   */
  prototype.close = function() {
    if (this.socket) {
      this.socket.close();
      return true;
    } else {
      return false;
    }
  };

  /** Sends data over the open connection.
   *
   * @param {String} data
   * @return {Boolean} true only when in the "open" state
   */
  prototype.send = function(data) {
    var self = this;

    if (self.state === "open") {
      // Workaround for MobileSafari bug (see https://gist.github.com/2052006)
      Pusher.Util.defer(function() {
        if (self.socket) {
          self.socket.send(data);
        }
      });
      return true;
    } else {
      return false;
    }
  };

  /** Sends a ping if the connection is open and transport supports it. */
  prototype.ping = function() {
    if (this.state === "open" && this.supportsPing()) {
      this.socket.ping();
    }
  };

  /** @private */
  prototype.onOpen = function() {
    if (this.hooks.beforeOpen) {
      this.hooks.beforeOpen(
        this.socket, this.hooks.urls.getPath(this.key, this.options)
      );
    }
    this.changeState("open");
    this.socket.onopen = undefined;
  };

  /** @private */
  prototype.onError = function(error) {
    this.emit("error", { type: 'WebSocketError', error: error });
    this.timeline.error(this.buildTimelineMessage({ error: error.toString() }));
  };

  /** @private */
  prototype.onClose = function(closeEvent) {
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
  };

  /** @private */
  prototype.onMessage = function(message) {
    this.emit("message", message);
  };

  /** @private */
  prototype.onActivity = function() {
    this.emit("activity");
  };

  /** @private */
  prototype.bindListeners = function() {
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
  };

  /** @private */
  prototype.unbindListeners = function() {
    if (this.socket) {
      this.socket.onopen = undefined;
      this.socket.onerror = undefined;
      this.socket.onclose = undefined;
      this.socket.onmessage = undefined;
      if (this.supportsPing()) {
        this.socket.onactivity = undefined;
      }
    }
  };

  /** @private */
  prototype.changeState = function(state, params) {
    this.state = state;
    this.timeline.info(this.buildTimelineMessage({
      state: state,
      params: params
    }));
    this.emit(state, params);
  };

  /** @private */
  prototype.buildTimelineMessage = function(message) {
    return Pusher.Util.extend({ cid: this.id }, message);
  };

  Pusher.TransportConnection = TransportConnection;
}).call(this);
