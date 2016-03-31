import * as URLSchemes from "core/transports/url_schemes";
import Transport from "core/transports//transport";
import Util from "core/util";
import * as Collections from "core/utils/collections.ts";
import TransportHooks from "core/transports/transport_hooks.ts";
import WS from 'ws';
import HTTPFactory from 'core/http/http';
import Factory from 'core/utils/factory';
import Runtime from 'runtime';

/** WebSocket transport.
 *
 * Uses native WebSocket implementation, including MozWebSocket supported by
 * earlier Firefox versions.
 */
var WSTransport = new Transport(<TransportHooks> {
  urls: URLSchemes.ws,
  handlesActivityChecks: false,
  supportsPing: false,

  isInitialized: function() {
    return Boolean(WS.getAPI());
  },
  isSupported: function() : boolean {
    return Boolean(WS.getAPI());
  },
  getSocket: function(url) {
    return Factory.createWebSocket(url);
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
  isSupported: function() : boolean {
    return Runtime.isXHRSupported()
  }
};
var xdrConfiguration = {
  isSupported: function(environment) : boolean {
    var yes = Runtime.isXDRSupported(environment.encrypted);
    return yes;
  }
};

/** HTTP streaming transport using CORS-enabled XMLHttpRequest. */
var XHRStreamingTransport = new Transport(
  <TransportHooks> Collections.extend({}, streamingConfiguration, xhrConfiguration)
);
/** HTTP streaming transport using XDomainRequest (IE 8,9). */
var XDRStreamingTransport = new Transport(
  <TransportHooks> Collections.extend({}, streamingConfiguration, xdrConfiguration)
);
/** HTTP long-polling transport using CORS-enabled XMLHttpRequest. */
var XHRPollingTransport = new Transport(
  <TransportHooks> Collections.extend({}, pollingConfiguration, xhrConfiguration)
);
/** HTTP long-polling transport using XDomainRequest (IE 8,9). */
var XDRPollingTransport = new Transport(
  <TransportHooks> Collections.extend({}, pollingConfiguration, xdrConfiguration)
);

var Transports = {
  WSTransport,
  XHRStreamingTransport,
  XDRStreamingTransport,
  XHRPollingTransport,
  XDRPollingTransport
}

export default Transports;
