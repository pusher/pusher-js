;(function() {
  /** WebSocket transport.
   *
   * @see AbstractTransport
   */
  function XHRStreamingTransport(name, priority, key, options) {
    Pusher.AbstractHTTPTransport.call(this, name, priority, key, options);
  }
  var prototype = XHRStreamingTransport.prototype;
  Pusher.Util.extend(prototype, Pusher.AbstractHTTPTransport.prototype);

  prototype.resource = "xhr";

  /** Creates a new instance of XHRStreamingTransport.
   *
   * @param  {String} key
   * @param  {Object} options
   * @return {XHRStreamingTransport}
   */
  XHRStreamingTransport.createConnection = function(name, priority, key, options) {
    return new XHRStreamingTransport(name, priority, key, options);
  };

  /** Checks whether the browser supports WebSockets in any form.
   *
   * @returns {Boolean} true if browser supports WebSockets
   */
  XHRStreamingTransport.isSupported = function() {
    return Pusher.Util.isXHRSupported();
  };

  /** @protected */
  prototype.createSocket = function(url) {
    return Pusher.HTTP.getStreamingSocket(url);
  };

  Pusher.XHRStreamingTransport = XHRStreamingTransport;
}).call(this);
