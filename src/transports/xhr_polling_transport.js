;(function() {
  /** WebSocket transport.
   *
   * @see AbstractTransport
   */
  function XHRPollingTransport(name, priority, key, options) {
    Pusher.AbstractHTTPTransport.call(this, name, priority, key, options);
  }
  var prototype = XHRPollingTransport.prototype;
  Pusher.Util.extend(prototype, Pusher.AbstractHTTPTransport.prototype);

  prototype.resource = "xhr";

  /** Creates a new instance of XHRPollingTransport.
   *
   * @param  {String} key
   * @param  {Object} options
   * @return {XHRPollingTransport}
   */
  XHRPollingTransport.createConnection = function(name, priority, key, options) {
    return new XHRPollingTransport(name, priority, key, options);
  };

  /** Checks whether the browser supports WebSockets in any form.
   *
   * @returns {Boolean} true if browser supports WebSockets
   */
  XHRPollingTransport.isSupported = function() {
    return Pusher.Util.isXHRSupported();
  };

  /** @protected */
  prototype.createSocket = function(url) {
    return Pusher.HTTP.getPollingSocket(url);
  };

  Pusher.XHRPollingTransport = XHRPollingTransport;
}).call(this);
