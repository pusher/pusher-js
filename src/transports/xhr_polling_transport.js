;(function() {
  /** WebSocket transport.
   *
   * @see AbstractTransport
   */
  function XHRPollingTransport(name, priority, key, options) {
    Pusher.AbstractTransport.call(this, name, priority, key, options);
  }
  var prototype = XHRPollingTransport.prototype;
  Pusher.Util.extend(prototype, Pusher.AbstractTransport.prototype);

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
    if (window.XMLHttpRequest) {
      if ('withCredentials' in (new window.XMLHttpRequest())) {
        return true;
      }
    }
    return false;
  };

  /** @protected */
  prototype.createSocket = function(url) {
    return new Pusher.HTTPPollingSocket(url);
  };

  /** Always returns true, since HTTP streaming handles ping on its own.
   *
   * @returns {Boolean} always true
   */
  prototype.supportsPing = function() {
    return true;
  };

  /** @protected */
  prototype.getScheme = function() {
    return this.options.encrypted ? "https" : "http";
  };

  /** @protected */
  prototype.getPath = function() {
    return (this.options.httpPath || "/pusher") + "/app/" + this.key;
  };

  Pusher.XHRPollingTransport = XHRPollingTransport;
}).call(this);
