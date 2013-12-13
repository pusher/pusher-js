;(function() {
  /** Transport using Flash to emulate WebSockets.
   *
   * @see AbstractTransport
   */
  function FlashTransport(name, priority, key, options) {
    Pusher.AbstractTransport.call(this, name, priority, key, options);
  }
  var prototype = FlashTransport.prototype;
  Pusher.Util.extend(prototype, Pusher.AbstractTransport.prototype);

  /** Creates a new instance of FlashTransport.
   *
   * @param  {String} key
   * @param  {Object} options
   * @return {FlashTransport}
   */
  FlashTransport.createConnection = function(name, priority, key, options) {
    return new FlashTransport(name, priority, key, options);
  };

  /** Checks whether Flash is supported in the browser.
   *
   * It is possible to disable flash by passing an envrionment object with the
   * disableFlash property set to true.
   *
   * @see AbstractTransport.isSupported
   * @param {Object} environment
   * @returns {Boolean}
   */
  FlashTransport.isSupported = function() {
    try {
      return Boolean(new ActiveXObject('ShockwaveFlash.ShockwaveFlash'));
    } catch (e) {
      try {
        return Boolean(
          navigator &&
          navigator.mimeTypes &&
          navigator.mimeTypes["application/x-shockwave-flash"] !== undefined
        );
      } catch(e) {
        return false;
      }
    }
  };

  /** Fetches flashfallback dependency if needed.
   *
   * Sets WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR to true (if not set before)
   * and WEB_SOCKET_SWF_LOCATION to Pusher's cdn before loading Flash resources.
   *
   * @see AbstractTransport.prototype.initialize
   */
  prototype.initialize = function() {
    var self = this;

    this.timeline.info(this.buildTimelineMessage({
      transport: this.name + (this.options.encrypted ? "s" : "")
    }));
    this.timeline.debug(this.buildTimelineMessage({ method: "initialize" }));
    this.changeState("initializing");

    if (window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR === undefined) {
      window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR = true;
    }
    window.WEB_SOCKET_SWF_LOCATION = Pusher.Dependencies.getRoot() +
      "/WebSocketMain.swf";
    Pusher.Dependencies.load("flashfallback", function() {
      self.changeState("initialized");
    });
  };

  /** @protected */
  prototype.createSocket = function(url) {
    return new FlashWebSocket(url);
  };

  /** @protected */
  prototype.getQueryString = function() {
    return Pusher.AbstractTransport.prototype.getQueryString.call(this) +
      "&flash=true";
  };

  Pusher.FlashTransport = FlashTransport;
}).call(this);
