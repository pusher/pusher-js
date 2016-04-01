import Transports from 'shared/transports/transports';
import Transport from 'core/transports/transport';
import TransportHooks from 'core/transports/transport_hooks';
import * as URLSchemes from 'core/transports/url_schemes';
import Runtime from 'runtime';
import {Dependencies} from '../dom/dependencies';

var SockJSTransport = new Transport(<TransportHooks>{
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

(<any>Transports).sockjs = SockJSTransport;

export default Transports;
