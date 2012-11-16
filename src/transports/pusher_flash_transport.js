;(function() {

  function PusherFlashTransport(key, options) {
    PusherWSTransport.call(this, key, options);
  };
  var prototype = PusherFlashTransport.prototype;

  Pusher.Util.extend(prototype, PusherWSTransport.prototype);

  // interface

  PusherFlashTransport.isSupported = function() {
    return navigator.mimeTypes["application/x-shockwave-flash"] != undefined;
  };

  prototype.name = "flash";

  prototype.load = function() {
    var self = this;

    Pusher.Dependencies.load("flashfallback", function() {
      self.changeState("loaded");
    });
  }

  prototype.getQueryString = function() {
    return "?protocol=5&client=js&flash=true&version=" + Pusher.VERSION;
  };

  this.PusherFlashTransport = PusherFlashTransport;
}).call(this);
