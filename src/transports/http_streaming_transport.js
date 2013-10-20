;(function() {
  /** WebSocket transport.
   *
   * @see AbstractTransport
   */
  function HTTPStreamingTransport(name, priority, key, options) {
    Pusher.AbstractTransport.call(this, name, priority, key, options);
  }
  var prototype = HTTPStreamingTransport.prototype;
  Pusher.Util.extend(prototype, Pusher.AbstractTransport.prototype);

  /** Creates a new instance of HTTPStreamingTransport.
   *
   * @param  {String} key
   * @param  {Object} options
   * @return {HTTPStreamingTransport}
   */
  HTTPStreamingTransport.createConnection = function(name, priority, key, options) {
    return new HTTPStreamingTransport(name, priority, key, options);
  };

  /** Checks whether the browser supports WebSockets in any form.
   *
   * @returns {Boolean} true if browser supports WebSockets
   */
  HTTPStreamingTransport.isSupported = function() {
    if (window.XMLHttpRequest) {
      if ('withCredentials' in (new window.XMLHttpRequest())) {
        return true;
      }
    }
    return false;
  };

  prototype.initialize = function() {
    var self = this;

    this.timeline.info(this.buildTimelineMessage({
      transport: this.name + (this.options.encrypted ? "s" : "")
    }));
    this.timeline.debug(this.buildTimelineMessage({ method: "initialize" }));

    this.changeState("initializing");
    Pusher.Dependencies.load("http_streamer", function() {
      self.changeState("initialized");
    });
  };

  /** @protected */
  prototype.createSocket = function(url) {
    return new Pusher.HTTPStreamer(url);
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

  Pusher.HTTPStreamingTransport = HTTPStreamingTransport;
}).call(this);
