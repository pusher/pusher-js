;(function() {
  /** WebSocket transport.
   *
   * @see AbstractTransport
   */
  function WSTransport(name, priority, key, options) {
    Pusher.AbstractTransport.call(this, name, priority, key, options);
  }
  var prototype = WSTransport.prototype;
  Pusher.Util.extend(prototype, Pusher.AbstractTransport.prototype);

  /** Creates a new instance of WSTransport.
   *
   * @param  {String} key
   * @param  {Object} options
   * @return {WSTransport}
   */
  WSTransport.createConnection = function(name, priority, key, options) {
    return new WSTransport(name, priority, key, options);
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
    var constructor = window.WebSocket || window.MozWebSocket;
    return new constructor(url);
  };

  /** @protected */
  prototype.getQueryString = function() {
    return Pusher.AbstractTransport.prototype.getQueryString.call(this) +
      "&flash=false";
  };

  Pusher.WSTransport = WSTransport;
}).call(this);
