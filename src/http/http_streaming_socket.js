var HTTPSocket = require('./http_socket');

var hooks = {
  getReceiveURL: function(url, session) {
    return url.base + "/" + session + "/xhr_streaming" + url.queryString;
  },
  onHeartbeat: function(socket) {
    socket.sendRaw("[]");
  },
  sendHeartbeat: function(socket) {
    socket.sendRaw("[]");
  },
  onFinished: function(socket, status) {
    socket.onClose(1006, "Connection interrupted (" + status + ")", false);
  }
};

module.exports = getStreamingSocket = function(url) {
  return new HTTPSocket(hooks, url);
};
