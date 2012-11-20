;(function() {

  function AbstractTransport(key, options) {
    Pusher.EventsDispatcher.call(this);

    this.key = key;
    this.options = options;
  };
  var prototype = AbstractTransport.prototype;

  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  // interface

  AbstractTransport.isSupported = function() {
    return false;
  };

  prototype.name = "abstract";

  prototype.initialize = function() {
    this.changeState("initialized");
  };

  prototype.connect = function() {
    if (this.socket || this.state === undefined) {
      return false;
    }

    var self = this;
    var url = this.getURL(this.key, this.options);

    this.socket = this.createSocket(url);
    this.bindListeners();

    this.changeState("connecting");
    return true;
  };

  prototype.close = function() {
    if (this.socket) {
      this.socket.close();
      return true;
    } else {
      return false;
    }
  };

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

  prototype.supportsPing = function() {
    // We have no way to know whether we're using a browser that supports ping
    return false;
  };

  // event listeners

  prototype.onOpen = function() {
    this.changeState("open");
    this.socket.onopen = undefined;
  };

  prototype.onError = function(error) {
    this.emit("error", { type: 'WebSocketError', error: error });
  };

  prototype.onClose = function() {
    this.changeState("closed");
    this.socket = undefined;
  };

  prototype.onMessage = function(message) {
    this.emit("message", message);
  };

  prototype.bindListeners = function() {
    var self = this;

    this.socket.onopen = function() { self.onOpen(); };
    this.socket.onerror = function(error) { self.onError(error); };
    this.socket.onclose = function() { self.onClose(); };
    this.socket.onmessage = function(message) { self.onMessage(message); };
  };

  // helpers

  prototype.createSocket = function (url) {
    return null;
  };

  prototype.getScheme = function() {
    return this.options.secure ? "wss" : "ws";
  };

  prototype.getBaseURL = function() {
    if (this.options.secure) {
      var port = this.options.securePort;
    } else {
      var port = this.options.nonsecurePort;
    }

    return this.getScheme() + "://" + this.options.host + ':' + port;
  };

  prototype.getQueryString = function() {
    return "?protocol=5&client=js&version=" + Pusher.VERSION;
  };

  prototype.getURL = function() {
    return this.getBaseURL() + "/app/" + this.key + this.getQueryString();
  };

  prototype.changeState = function(state, params) {
    this.state = state;
    this.emit(state, params);
  };

  Pusher.AbstractTransport = AbstractTransport;
}).call(this);
