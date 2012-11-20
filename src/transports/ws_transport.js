;(function() {

  function WSTransport(key, options) {
    Pusher.AbstractTransport.call(this);

    this.key = key;
    this.options = options;
  };
  var prototype = WSTransport.prototype;

  Pusher.Util.extend(prototype, Pusher.AbstractTransport.prototype);

  // interface

  WSTransport.isSupported = function() {
    return window.WebSocket != undefined || window.MozWebSocket != undefined;
  };

  prototype.name = "ws";

  // helpers

  prototype.createSocket = function(url) {
    return new (WebSocket || MozWebSocket)(url);
  }

  prototype.getQueryString = function() {
    return Pusher.AbstractTransport.prototype.getQueryString.call(this)
      + "&flash=false";
  };

  Pusher.WSTransport = WSTransport;
}).call(this);
