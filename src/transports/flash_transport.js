;(function() {

  function FlashTransport(key, options) {
    Pusher.AbstractTransport.call(this, key, options);
  }
  var prototype = FlashTransport.prototype;

  Pusher.Util.extend(prototype, Pusher.AbstractTransport.prototype);

  // interface

  FlashTransport.isSupported = function() {
    return navigator.mimeTypes["application/x-shockwave-flash"] !== undefined;
  };

  FlashTransport.createConnection = function(key, options) {
    return new FlashTransport(key, options);
  };

  prototype.name = "flash";

  prototype.initialize = function() {
    var self = this;

    this.changeState("initializing");

    window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR = true;
    window.WEB_SOCKET_SWF_LOCATION = Pusher.Dependencies.getRoot() +
      "/WebSocketMain.swf";
    Pusher.Dependencies.load("flashfallback", function() {
      self.changeState("initialized");
    });
  };

  prototype.createSocket = function(url) {
    return new WebSocket(url);
  };

  prototype.getQueryString = function() {
    return Pusher.AbstractTransport.prototype.getQueryString.call(this) +
      "&flash=true";
  };

  Pusher.FlashTransport = FlashTransport;
}).call(this);
