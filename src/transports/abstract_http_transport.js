;(function() {
  /** Abstract class for HTTP transports.
   *
   * @see AbstractTransport
   */
  function AbstractHTTPTransport(name, priority, key, options) {
    Pusher.AbstractTransport.call(this, name, priority, key, options);
  }
  var prototype = AbstractHTTPTransport.prototype;
  Pusher.Util.extend(prototype, Pusher.AbstractTransport.prototype);

  /** Always returns true, since all HTTP transports handle ping on their own.
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

  Pusher.AbstractHTTPTransport = AbstractHTTPTransport;
}).call(this);
