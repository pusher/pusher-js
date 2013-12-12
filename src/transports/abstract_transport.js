;(function() {
  /** Handles common logic for all transports.
   *
   * Transport is a low-level connection object that wraps a connection method
   * and exposes a simple evented interface for the connection state and
   * messaging. It does not implement Pusher-specific WebSocket protocol.
   *
   * Additionally, it fetches resources needed for transport to work and exposes
   * an interface for querying transport support and its features.
   *
   * This is an abstract class, please do not instantiate it.
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
  function AbstractTransport(name, priority, key, options) {
    Pusher.EventsDispatcher.call(this);

    this.name = name;
    this.priority = priority;
    this.key = key;
    this.state = "new";
    this.timeline = options.timeline;
    this.activityTimeout = options.activityTimeout;
    this.id = this.timeline.generateUniqueID();

    this.options = {
      encrypted: Boolean(options.encrypted),
      hostUnencrypted: options.hostUnencrypted,
      hostEncrypted: options.hostEncrypted
    };
  }
  var prototype = AbstractTransport.prototype;
  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  /** Checks whether the transport is supported in the browser.
   *
   * @returns {Boolean}
   */
  AbstractTransport.isSupported = function() {
    return false;
  };

  /** Checks whether the transport handles ping/pong on itself.
   *
   * @return {Boolean}
   */
  prototype.supportsPing = function() {
    return false;
  };

  /** Initializes the transport.
   *
   * Fetches resources if needed and then transitions to initialized.
   */
  prototype.initialize = function() {
    this.timeline.info(this.buildTimelineMessage({
      transport: this.name + (this.options.encrypted ? "s" : "")
    }));
    this.timeline.debug(this.buildTimelineMessage({ method: "initialize" }));

    this.changeState("initialized");
  };

  /** Tries to establish a connection.
   *
   * @returns {Boolean} false if transport is in invalid state
   */
  prototype.connect = function() {
    var url = this.getURL(this.key, this.options);
    this.timeline.debug(this.buildTimelineMessage({
      method: "connect",
      url: url
    }));

    if (this.socket || this.state !== "initialized") {
      return false;
    }

    try {
      this.socket = this.createSocket(url);
    } catch (e) {
      var self = this;
      Pusher.Util.defer(function() {
        self.onError(e);
        self.changeState("closed");
      });
      return false;
    }

    this.bindListeners();

    Pusher.debug("Connecting", { transport: this.name, url: url });
    this.changeState("connecting");
    return true;
  };

  /** Closes the connection.
   *
   * @return {Boolean} true if there was a connection to close
   */
  prototype.close = function() {
    this.timeline.debug(this.buildTimelineMessage({ method: "close" }));

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
    this.timeline.debug(this.buildTimelineMessage({
      method: "send",
      data: data
    }));

    if (this.state === "open") {
      // Workaround for MobileSafari bug (see https://gist.github.com/2052006)
      var self = this;
      setTimeout(function() {
        if (self.socket) {
          self.socket.send(data);
        }
      }, 0);
      return true;
    } else {
      return false;
    }
  };

  /** @protected */
  prototype.onOpen = function() {
    this.changeState("open");
    this.socket.onopen = undefined;
  };

  /** @protected */
  prototype.onError = function(error) {
    this.emit("error", { type: 'WebSocketError', error: error });
    this.timeline.error(this.buildTimelineMessage({}));
  };

  /** @protected */
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
    this.socket = undefined;
  };

  /** @protected */
  prototype.onMessage = function(message) {
    this.timeline.debug(this.buildTimelineMessage({ message: message.data }));
    this.emit("message", message);
  };

  /** @protected */
  prototype.bindListeners = function() {
    var self = this;

    this.socket.onopen = function() { self.onOpen(); };
    this.socket.onerror = function(error) { self.onError(error); };
    this.socket.onclose = function(closeEvent) { self.onClose(closeEvent); };
    this.socket.onmessage = function(message) { self.onMessage(message); };
  };

  /** @protected */
  prototype.createSocket = function(url) {
    return null;
  };

  /** @protected */
  prototype.getScheme = function() {
    return this.options.encrypted ? "wss" : "ws";
  };

  /** @protected */
  prototype.getBaseURL = function() {
    var host;
    if (this.options.encrypted) {
      host = this.options.hostEncrypted;
    } else {
      host = this.options.hostUnencrypted;
    }
    return this.getScheme() + "://" + host;
  };

  /** @protected */
  prototype.getPath = function() {
    return "/app/" + this.key;
  };

  /** @protected */
  prototype.getQueryString = function() {
    return "?protocol=" + Pusher.PROTOCOL +
      "&client=js&version=" + Pusher.VERSION;
  };

  /** @protected */
  prototype.getURL = function() {
    return this.getBaseURL() + this.getPath() + this.getQueryString();
  };

  /** @protected */
  prototype.changeState = function(state, params) {
    this.state = state;
    this.timeline.info(this.buildTimelineMessage({
      state: state,
      params: params
    }));
    this.emit(state, params);
  };

  /** @protected */
  prototype.buildTimelineMessage = function(message) {
    return Pusher.Util.extend({ cid: this.id }, message);
  };

  Pusher.AbstractTransport = AbstractTransport;
}).call(this);
