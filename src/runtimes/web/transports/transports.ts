import {
  default as Transports,
  streamingConfiguration,
  pollingConfiguration
} from 'isomorphic/transports/transports';
import Transport from 'core/transports/transport';
import TransportHooks from 'core/transports/transport_hooks';
import * as URLSchemes from 'core/transports/url_schemes';
import Runtime from 'runtime';
import {Dependencies} from '../dom/dependencies';
import * as Collections from "core/utils/collections";

var SockJSTransport = new Transport(<TransportHooks>{
  file: "sockjs",
  urls: URLSchemes.sockjs,
  handlesActivityChecks: true,
  supportsPing: false,

  isSupported: function() {
    return true;
  },
  isInitialized: function() {
    return window.SockJS !== undefined;
  },
  getSocket: function(url, options) {
    return new window.SockJS(url, null, {
      js_path: Dependencies.getPath("sockjs", {
        useTLS: options.useTLS
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

var xdrConfiguration = {
  isSupported: function(environment) : boolean {
    var yes = Runtime.isXDRSupported(environment.useTLS);
    return yes;
  }
};

/** HTTP streaming transport using XDomainRequest (IE 8,9). */
var XDRStreamingTransport = new Transport(
  <TransportHooks> Collections.extend({}, streamingConfiguration, xdrConfiguration)
);

/** HTTP long-polling transport using XDomainRequest (IE 8,9). */
var XDRPollingTransport = new Transport(
  <TransportHooks> Collections.extend({}, pollingConfiguration, xdrConfiguration)
);

Transports.xdr_streaming = XDRStreamingTransport;
Transports.xdr_polling = XDRPollingTransport;
Transports.sockjs = SockJSTransport;

export default Transports;
