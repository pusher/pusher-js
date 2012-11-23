;(function() {

  function FlashTransport(key, options) {
    Pusher.AbstractTransport.call(this, key, options);
  };
  var prototype = FlashTransport.prototype;

  Pusher.Util.extend(prototype, Pusher.AbstractTransport.prototype);

  // interface

  FlashTransport.isSupported = function() {
    return navigator.mimeTypes["application/x-shockwave-flash"] != undefined;
  };

  prototype.name = "flash";

  prototype.initialize = function() {
    var self = this;

    this.changeState("initializing");
    Pusher.Dependencies.load("flashfallback", function() {
      self.changeState("initialized");
    });
  };

  prototype.createSocket = function(url) {
    return new WebSocket(url);
  };

  prototype.getQueryString = function() {
    return Pusher.AbstractTransport.prototype.getQueryString.call(this)
      + "&flash=true";
  };

  Pusher.FlashTransport = FlashTransport;
}).call(this);
