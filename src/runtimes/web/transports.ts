import Transports from 'shared/transports';

Transports.SockJSTransport = new Transport(<TransportHooks>{
  file: "sockjs",
  urls: URLSchemes.sockjs,
  handlesActivityChecks: true,
  supportsPing: false,

  isSupported: function() {
    return Runtime.isSockJSSupported();
  },
  isInitialized: function() {
    return window.SockJS !== undefined;
  },
  getSocket: function(url, options) {
    return new window.SockJS(url, null, {
      js_path: Dependencies.getPath("sockjs", {
        encrypted: options.encrypted
      }),
      ignore_null_origin: options.ignoreNullOrigin
    });
  },
  beforeOpen: function(socket, path) {
    socket.send(JSON.stringify({
      path: path
    }));
  }
});

export default Transports;
