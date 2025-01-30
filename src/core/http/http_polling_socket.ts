import SocketHooks from './socket_hooks';
import URLLocation from './url_location';
import HTTPSocket from './http_socket';

var hooks: SocketHooks = {
  getReceiveURL: function (url: URLLocation, session: string): string {
    return url.base + '/' + session + '/xhr' + url.queryString;
  },
  onHeartbeat: function () {
    // next HTTP request will reset server's activity timer
  },
  sendHeartbeat: function (socket) {
    socket.sendRaw('[]');
  },
  onFinished: function (socket, status) {
    if (status === 200) {
      socket.reconnect();
    } else {
      socket.onClose(1006, 'Connection interrupted (' + status + ')', false);
    }
  },
};

export default hooks;
