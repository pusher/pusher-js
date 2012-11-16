;(function() {

  function PusherWSTransport(key, options) {
    Pusher.EventsDispatcher.call(this);

    this.key = key;
    this.options = options;
  };
  var prototype = PusherWSTransport.prototype;

  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  // interface

  PusherWSTransport.isSupported = function() {
    return window.WebSocket != undefined || window.MozWebSocket != undefined;
  };

  prototype.name = "ws";

  prototype.load = function() {
    this.changeState("loaded");
  }

  prototype.connect = function() {
    if (this.socket) {
      return false;
    }

    var self = this;
    var url = this.getURL(this.key, this.options);

    this.socket = new (WebSocket || MozWebSocket)(url);
    this.socket.onopen = function() {
      self.changeState("open");
      self.socket.onopen = undefined;
    };
    this.socket.onerror = function(error) {
      self.emit("error", { type: 'WebSocketError', error: error });
    };
    this.socket.onclose = function() {
      self.changeState("closed");
      self.socket = undefined;
    };
    this.socket.onmessage = function(message) {
      self.emit("message", message);
    };

    this.changeState("connecting");
    return true;
  };

  prototype.close = function() {
    this.socket.close();
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

  // helpers

  prototype.getURL = function() {
    if (this.options.secure) {
      var port = this.options.securePort;
      var scheme = "wss"
    } else {
      var port = this.options.nonsecurePort;
      var scheme = "ws";
    }
    var path = "/app/" + this.key + this.getQueryString();

    return scheme + "://" + this.options.host + ':' + port + path;
  };

  prototype.getQueryString = function() {
    return "?protocol=5&client=js&flash=false&version=" + Pusher.VERSION;
  };

  prototype.changeState = function(state, params) {
    this.state = state;
    this.emit(state, params);
  };

  this.PusherWSTransport = PusherWSTransport;
}).call(this);
