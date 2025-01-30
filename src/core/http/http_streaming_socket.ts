import SocketHooks from './socket_hooks';
import HTTPSocket from './http_socket';

var hooks: SocketHooks = {
  getReceiveURL: function (url, session) {
    return url.base + '/' + session + '/xhr_streaming' + url.queryString;
  },
  onHeartbeat: function (socket) {
    socket.sendRaw('[]');
  },
  sendHeartbeat: function (socket) {
    socket.sendRaw('[]');
  },
  onFinished: function (socket, status) {
    socket.onClose(1006, 'Connection interrupted (' + status + ')', false);
  },
};

export default hooks;
