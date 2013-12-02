;(function() {
  function HTTPPollingSocket(url) {
    Pusher.HTTPSocket.call(this, url);
  }
  var prototype = HTTPPollingSocket.prototype;
  Pusher.Util.extend(prototype, Pusher.HTTPSocket.prototype);

  /** @protected */
  prototype.getReceiveURL = function(url, session) {
    return url.base + "/" + session + "/xhr" + url.queryString;
  };

  /** @protected */
  prototype.onFinished = function(status) {
    if (status === 200) {
      this.reconnect();
    } else {
      this.onClose(1006, "Connection interrupted (" + status + ")", false);
    }
  };

  /** @protected */
  prototype.onHeartbeat = function() {
    // next HTTP request will reset server's activity timer
  };

  Pusher.HTTPPollingSocket = HTTPPollingSocket;
}).call(this);
