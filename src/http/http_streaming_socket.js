;(function() {
  function HTTPStreamingSocket(url) {
    Pusher.HTTPSocket.call(this, url);
  }
  var prototype = HTTPStreamingSocket.prototype;
  Pusher.Util.extend(prototype, Pusher.HTTPSocket.prototype);

  /** @protected */
  prototype.getReceiveURL = function(url, session) {
    return url.base + "/" + session + "/xhr_streaming" + url.queryString;
  };

  /** @protected */
  prototype.onFinished = function() {
    this.onClose(1006, "Connection interrupted", false);
  };

  /** @protected */
  prototype.onHeartbeat = function() {
    this.sendRaw("[]");
  };

  Pusher.HTTPStreamingSocket = HTTPStreamingSocket;
}).call(this);
