var Transport = require('./transport');
var URLSchemes = require('./url_schemes');
var Util = require('../util');
var HTTP = require('../http/http');

/** WebSocket transport.
 *
 * Uses native WebSocket implementation, including MozWebSocket supported by
 * earlier Firefox versions.
 */
exports.WSTransport = new Transport({
  urls: URLSchemes.ws,
  handlesActivityChecks: false,
  supportsPing: false,

  isInitialized: function() {
    return Boolean(window.WebSocket || window.MozWebSocket);
  },
  isSupported: function() {
    return Boolean(window.WebSocket || window.MozWebSocket);
  },
  getSocket: function(url) {
    var Constructor = window.WebSocket || window.MozWebSocket;
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

var streamingConfiguration = Util.extend(
  { getSocket: function(url) {
      return HTTP.getStreamingSocket(url);
    }
  },
  httpConfiguration
);
var pollingConfiguration = Util.extend(
  { getSocket: function(url) {
      return HTTP.getPollingSocket(url);
    }
  },
  httpConfiguration
);

var xhrConfiguration = {
  isSupported: Util.isXHRSupported
};
var xdrConfiguration = {
  isSupported: function(environment) {
    return Util.isXDRSupported(environment.encrypted);
  }
};

/** HTTP streaming transport using CORS-enabled XMLHttpRequest. */
exports.XHRStreamingTransport = new Transport(
  Util.extend({}, streamingConfiguration, xhrConfiguration)
);
/** HTTP streaming transport using XDomainRequest (IE 8,9). */
exports.XDRStreamingTransport = new Transport(
  Util.extend({}, streamingConfiguration, xdrConfiguration)
);
/** HTTP long-polling transport using CORS-enabled XMLHttpRequest. */
exports.XHRPollingTransport = new Transport(
  Util.extend({}, pollingConfiguration, xhrConfiguration)
);
/** HTTP long-polling transport using XDomainRequest (IE 8,9). */
exports.XDRPollingTransport = new Transport(
  Util.extend({}, pollingConfiguration, xdrConfiguration)
);
