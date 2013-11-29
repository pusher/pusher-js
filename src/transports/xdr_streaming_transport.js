;(function() {
  /** WebSocket transport.
   *
   * @see AbstractTransport
   */
  function XDRStreamingTransport(name, priority, key, options) {
    Pusher.XHRStreamingTransport.call(this, name, priority, key, options);
  }
  var prototype = XDRStreamingTransport.prototype;
  Pusher.Util.extend(prototype, Pusher.XHRStreamingTransport.prototype);

  prototype.resource = "xdr";

  /** Creates a new instance of XDRStreamingTransport.
   *
   * @param  {String} key
   * @param  {Object} options
   * @return {XDRStreamingTransport}
   */
  XDRStreamingTransport.createConnection = function(name, priority, key, options) {
    return new XDRStreamingTransport(name, priority, key, options);
  };

  /** Checks whether the browser supports WebSockets in any form.
   *
   * @returns {Boolean} true if browser supports WebSockets
   */
  XDRStreamingTransport.isSupported = function(environment) {
    return Pusher.Util.isXDRSupported(environment.encrypted);
  };

  Pusher.XDRStreamingTransport = XDRStreamingTransport;
}).call(this);
