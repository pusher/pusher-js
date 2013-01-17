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
   * - entryptedPort - port to connect to when encrypted
   * - unencryptedPort - port to connect to when not encrypted
   * - host - hostname to connect to
   *
   * @param {String} key application key
   * @param {Object} options
   */
  function AbstractTransport(key, options) {
    Pusher.EventsDispatcher.call(this);

    this.key = key;
    this.options = options;
    this.state = "new";
    this.timeline = options.timeline;
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
    this.changeState("initialized");
  };

  /** Tries to establish a connection.
   *
   * @returns {Boolean} false if transport is in invalid state
   */
  prototype.connect = function() {
    if (this.socket || this.state !== "initialized") {
      return false;
    }

    var self = this;
    var url = this.getURL(this.key, this.options);

    this.socket = this.createSocket(url);
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
    if (this.state === "open") {
      // Workaround for MobileSafari bug (see https://gist.github.com/2052006)
      var self = this;
      setTimeout(function() {
        self.socket.send(data);
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
    this.log({ error: error.name || "unknown" });
  };

  /** @protected */
  prototype.onClose = function() {
    this.changeState("closed");
    this.socket = undefined;
  };

  /** @protected */
  prototype.onMessage = function(message) {
    this.emit("message", message);
  };

  /** @protected */
  prototype.bindListeners = function() {
    var self = this;

    this.socket.onopen = function() { self.onOpen(); };
    this.socket.onerror = function(error) { self.onError(error); };
    this.socket.onclose = function() { self.onClose(); };
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
    var port;
    if (this.options.encrypted) {
      port = this.options.encryptedPort;
    } else {
      port = this.options.unencryptedPort;
    }

    return this.getScheme() + "://" + this.options.host + ':' + port;
  };

  /** @protected */
  prototype.getPath = function() {
    return "/app/" + this.key;
  };

  /** @protected */
  prototype.getQueryString = function() {
    return "?protocol=5&client=js&version=" + Pusher.VERSION;
  };

  /** @protected */
  prototype.getURL = function() {
    return this.getBaseURL() + this.getPath() + this.getQueryString();
  };

  /** @protected */
  prototype.changeState = function(state, params) {
    this.state = state;
    this.emit(state, params);
    this.log({ state: state, params: params });
  };

  /** @protected */
  prototype.log = function(message) {
    if (this.timeline) {
      this.timeline.push(Pusher.Util.extend({
        transport: this.name + (this.options.encrypted ? "s" : "")
      }, message));
    }
  };

  Pusher.AbstractTransport = AbstractTransport;
}).call(this);
