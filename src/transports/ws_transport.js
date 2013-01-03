;(function() {
  /** WebSocket transport.
   *
   * @see AbstractTransport
   */
  function WSTransport(key, options) {
    Pusher.AbstractTransport.call(this, key, options);
  }
  var prototype = WSTransport.prototype;

  Pusher.Util.extend(prototype, Pusher.AbstractTransport.prototype);

  prototype.name = "ws";

  /** Creates a new instance of WSTransport.
   *
   * @param  {String} key
   * @param  {Object} options
   * @return {WSTransport}
   */
  WSTransport.createConnection = function(key, options) {
    return new WSTransport(key, options);
  };

  /** Checks whether the browser supports WebSockets in any form.
   *
   * @returns {Boolean} true if browser supports WebSockets
   */
  WSTransport.isSupported = function() {
    return window.WebSocket !== undefined || window.MozWebSocket !== undefined;
  };

  /** @protected */
  prototype.createSocket = function(url) {
    var constructor = WebSocket || MozWebSocket;
    return new constructor(url);
  };

  /** @protected */
  prototype.getQueryString = function() {
    return Pusher.AbstractTransport.prototype.getQueryString.call(this) +
      "&flash=false";
  };

  Pusher.WSTransport = WSTransport;
}).call(this);
