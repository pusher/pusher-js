import * as URLSchemes from 'core/transports/url_schemes';
import URLScheme from 'core/transports/url_scheme';
import Transport from 'core/transports/transport';
import Util from 'core/util';
import * as Collections from 'core/utils/collections';
import TransportHooks from 'core/transports/transport_hooks';
import TransportsTable from 'core/transports/transports_table';
import Runtime from 'runtime';

/** WebSocket transport.
 *
 * Uses native WebSocket implementation, including MozWebSocket supported by
 * earlier Firefox versions.
 */
var WSTransport = new Transport(<TransportHooks>{
  urls: URLSchemes.ws,
  handlesActivityChecks: false,
  supportsPing: false,

  isInitialized: function () {
    return Boolean(Runtime.getWebSocketAPI());
  },
  isSupported: function (): boolean {
    return Boolean(Runtime.getWebSocketAPI());
  },
  getSocket: function (url) {
    return Runtime.createWebSocket(url);
  },
});

var httpConfiguration = {
  urls: URLSchemes.http,
  handlesActivityChecks: false,
  supportsPing: true,
  isInitialized: function () {
    return true;
  },
};

export var streamingConfiguration = Collections.extend(
  {
    getSocket: function (url) {
      return Runtime.HTTPFactory.createStreamingSocket(url);
    },
  },
  httpConfiguration,
);
export var pollingConfiguration = Collections.extend(
  {
    getSocket: function (url) {
      return Runtime.HTTPFactory.createPollingSocket(url);
    },
  },
  httpConfiguration,
);

var xhrConfiguration = {
  isSupported: function (): boolean {
    return Runtime.isXHRSupported();
  },
};

/** HTTP streaming transport using CORS-enabled XMLHttpRequest. */
var XHRStreamingTransport = new Transport(
  <TransportHooks>(
    Collections.extend({}, streamingConfiguration, xhrConfiguration)
  ),
);

/** HTTP long-polling transport using CORS-enabled XMLHttpRequest. */
var XHRPollingTransport = new Transport(
  <TransportHooks>(
    Collections.extend({}, pollingConfiguration, xhrConfiguration)
  ),
);

var Transports: TransportsTable = {
  ws: WSTransport,
  xhr_streaming: XHRStreamingTransport,
  xhr_polling: XHRPollingTransport,
};

export default Transports;
