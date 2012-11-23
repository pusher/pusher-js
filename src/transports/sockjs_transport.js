;(function() {

  function SockJSTransport(key, options) {
    Pusher.AbstractTransport.call(this, key, options);
  };
  var prototype = SockJSTransport.prototype;

  Pusher.Util.extend(prototype, Pusher.AbstractTransport.prototype);

  // interface

  SockJSTransport.isSupported = function() {
    return true;
  };

  SockJSTransport.createConnection = function(key, options) {
    return new SockJSTransport(key, options);
  };

  prototype.name = "sockjs";

  prototype.initialize = function() {
    var self = this;

    this.changeState("initializing");
    Pusher.Dependencies.load("sockjs", function() {
      self.changeState("initialized");
    });
  };

  prototype.createSocket = function(url) {
    return new SockJS(url);
  };

  prototype.supportsPing = function() {
    return true;
  };

  prototype.getScheme = function() {
    return this.options.secure ? "https" : "http";
  };

  prototype.getPath = function() {
    return "/pusher";
  };

  prototype.getQueryString = function() {
    return "";
  };

  prototype.onOpen = function() {
    this.socket.send(JSON.stringify({
      path: Pusher.AbstractTransport.prototype.getPath.call(this)
    }));
    this.changeState("open");
    this.socket.onopen = undefined;
  };

  Pusher.SockJSTransport = SockJSTransport;
}).call(this);
