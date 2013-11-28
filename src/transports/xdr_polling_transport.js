;(function() {
  /** WebSocket transport.
   *
   * @see AbstractTransport
   */
  function XDRPollingTransport(name, priority, key, options) {
    Pusher.XHRPollingTransport.call(this, name, priority, key, options);
  }
  var prototype = XDRPollingTransport.prototype;
  Pusher.Util.extend(prototype, Pusher.XHRPollingTransport.prototype);

  prototype.resource = "xdr";

  /** Creates a new instance of XDRPollingTransport.
   *
   * @param  {String} key
   * @param  {Object} options
   * @return {XDRPollingTransport}
   */
  XDRPollingTransport.createConnection = function(name, priority, key, options) {
    return new XDRPollingTransport(name, priority, key, options);
  };

  /** Checks whether the browser supports WebSockets in any form.
   *
   * @returns {Boolean} true if browser supports WebSockets
   */
  XDRPollingTransport.isSupported = function(environment) {
    var originProtocol = Pusher.Util.getDocumentLocation().protocol;
    var requestedProtocol = environment.encrypted ? "https:" : "http:";
    return window.XDomainRequest && originProtocol === requestedProtocol;
  };

  Pusher.XDRPollingTransport = XDRPollingTransport;
}).call(this);
