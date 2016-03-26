import * as URLSchemes from "./url_schemes.ts";
import Transport from "./transport.ts";
import * as Util from "../util.ts";
import * as Collections from "../utils/collections.ts";
import TransportHooks from "./transport_hooks.ts";
import WS from 'pusher-websocket-iso-externals-node/ws';
import HTTPFactory from '../http/http';

/** WebSocket transport.
 *
 * Uses native WebSocket implementation, including MozWebSocket supported by
 * earlier Firefox versions.
 */
export var WSTransport = new Transport(<TransportHooks> {
  urls: URLSchemes.ws,
  handlesActivityChecks: false,
  supportsPing: false,

  isInitialized: function() {
    return Boolean(WS);
  },
  isSupported: function() {
    return Boolean(WS);
  },
  getSocket: function(url) {
    var Constructor = WS;
    return new Constructor(url);
  }
});

var httpConfiguration = {
  urls: URLSchemes.http,
  handlesActivityChecks: false,
  supportsPing: true,
  isInitialized: function() {
    return true;
  }
};

var streamingConfiguration = Collections.extend(
  { getSocket: function(url) {
      return HTTPFactory.createStreamingSocket(url);
    }
  },
  httpConfiguration
);
var pollingConfiguration = Collections.extend(
  { getSocket: function(url) {
      return HTTPFactory.createPollingSocket(url);
    }
  },
  httpConfiguration
);

var xhrConfiguration = {
  isSupported: function() {
    return Util.isXHRSupported()
  }
};
var xdrConfiguration = {
  isSupported: function(environment) {
    return Util.isXDRSupported(environment.encrypted);
  }
};

/** HTTP streaming transport using CORS-enabled XMLHttpRequest. */
export var XHRStreamingTransport = new Transport(
  <TransportHooks> Collections.extend({}, streamingConfiguration, xhrConfiguration)
);
/** HTTP streaming transport using XDomainRequest (IE 8,9). */
export var XDRStreamingTransport = new Transport(
  <TransportHooks> Collections.extend({}, streamingConfiguration, xdrConfiguration)
);
/** HTTP long-polling transport using CORS-enabled XMLHttpRequest. */
export var XHRPollingTransport = new Transport(
  <TransportHooks> Collections.extend({}, pollingConfiguration, xhrConfiguration)
);
/** HTTP long-polling transport using XDomainRequest (IE 8,9). */
export var XDRPollingTransport = new Transport(
  <TransportHooks> Collections.extend({}, pollingConfiguration, xdrConfiguration)
);
