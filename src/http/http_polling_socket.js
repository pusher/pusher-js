;(function() {
  var hooks = {
    getReceiveURL: function(url, session) {
      return url.base + "/" + session + "/xhr" + url.queryString;
    },
    onHeartbeat: function() {
      // next HTTP request will reset server's activity timer
    },
    sendHeartbeat: function(socket) {
      socket.sendRaw("[]");
    },
    onFinished: function(socket, status) {
      if (status === 200) {
        socket.reconnect();
      } else {
        socket.onClose(1006, "Connection interrupted (" + status + ")", false);
      }
    }
  };

  Pusher.HTTP.getPollingSocket = function(url) {
    return new Pusher.HTTP.Socket(hooks, url);
  };
}).call(this);
