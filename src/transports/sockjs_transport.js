;(function() {
  /** Fallback transport using SockJS.
   *
   * @see AbstractTransport
   */
  function SockJSTransport(name, priority, key, options) {
    Pusher.AbstractHTTPTransport.call(this, name, priority, key, options);
    this.options.ignoreNullOrigin = options.ignoreNullOrigin;
  }
  var prototype = SockJSTransport.prototype;
  Pusher.Util.extend(prototype, Pusher.AbstractHTTPTransport.prototype);

  prototype.resource = "sockjs";

  /** Creates a new instance of SockJSTransport.
   *
   * @param  {String} key
   * @param  {Object} options
   * @return {SockJSTransport}
   */
  SockJSTransport.createConnection = function(name, priority, key, options) {
    return new SockJSTransport(name, priority, key, options);
  };

  /** Assumes that SockJS is always supported.
   *
   * @returns {Boolean} always true
   */
  SockJSTransport.isSupported = function() {
    return true;
  };

  /** @protected */
  prototype.createSocket = function(url) {
    return new SockJS(url, null, {
      js_path: Pusher.Dependencies.getPath("sockjs", {
        encrypted: this.options.encrypted
      }),
      ignore_null_origin: this.options.ignoreNullOrigin
    });
  };

  /** @protected */
  prototype.getPath = function() {
    return this.options.httpPath || "/pusher";
  };

  /** @protected */
  prototype.getQueryString = function() {
    return "";
  };

  /** Handles opening a SockJS connection to Pusher.
   *
   * Since SockJS does not handle custom paths, we send it immediately after
   * establishing the connection.
   *
   * @protected
   */
  prototype.onOpen = function() {
    this.socket.send(JSON.stringify({
      path: Pusher.AbstractTransport.prototype.getPath.call(this) +
        Pusher.AbstractTransport.prototype.getQueryString.call(this)
    }));
    this.changeState("open");
    this.socket.onopen = undefined;
  };

  Pusher.SockJSTransport = SockJSTransport;
}).call(this);
