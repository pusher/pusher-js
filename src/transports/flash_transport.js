;(function() {

  function FlashTransport(key, options) {
    Pusher.WSTransport.call(this, key, options);
  };
  var prototype = FlashTransport.prototype;

  Pusher.Util.extend(prototype, Pusher.WSTransport.prototype);

  // interface

  FlashTransport.isSupported = function() {
    return navigator.mimeTypes["application/x-shockwave-flash"] != undefined;
  };

  prototype.name = "flash";

  prototype.initialize = function() {
    var self = this;

    Pusher.Dependencies.load("flashfallback", function() {
      self.changeState("initialized");
    });
  }

  prototype.getQueryString = function() {
    return "?protocol=5&client=js&flash=true&version=" + Pusher.VERSION;
  };

  Pusher.FlashTransport = FlashTransport;
}).call(this);
