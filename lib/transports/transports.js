"use strict";
var URLSchemes = require("./url_schemes.ts");
var transport_ts_1 = require("./transport.ts");
var Collections = require("../utils/collections.ts");
var ws_1 = require('pusher-websocket-iso-externals-node/ws');
var http_1 = require('../http/http');
var factory_1 = require('../utils/factory');
var runtime_1 = require('pusher-websocket-iso-externals-node/runtime');
var dependencies_1 = require('../runtimes/dom/dependencies');
var WSTransport = new transport_ts_1.default({
    urls: URLSchemes.ws,
    handlesActivityChecks: false,
    supportsPing: false,
    isInitialized: function () {
        return Boolean(ws_1.default.getAPI());
    },
    isSupported: function () {
        return Boolean(ws_1.default.getAPI());
    },
    getSocket: function (url) {
        return factory_1.default.createWebSocket(url);
    }
});
var SockJSTransport = new transport_ts_1.default({
    file: "sockjs",
    urls: URLSchemes.sockjs,
    handlesActivityChecks: true,
    supportsPing: false,
    isSupported: function () {
        return runtime_1.default.isSockJSSupported();
    },
    isInitialized: function () {
        return window.SockJS !== undefined;
    },
    getSocket: function (url, options) {
        return new window.SockJS(url, null, {
            js_path: dependencies_1.Dependencies.getPath("sockjs", {
                encrypted: options.encrypted
            }),
            ignore_null_origin: options.ignoreNullOrigin
        });
    },
    beforeOpen: function (socket, path) {
        socket.send(JSON.stringify({
            path: path
        }));
    }
});
var httpConfiguration = {
    urls: URLSchemes.http,
    handlesActivityChecks: false,
    supportsPing: true,
    isInitialized: function () {
        return true;
    }
};
var streamingConfiguration = Collections.extend({ getSocket: function (url) {
        return http_1.default.createStreamingSocket(url);
    }
}, httpConfiguration);
var pollingConfiguration = Collections.extend({ getSocket: function (url) {
        return http_1.default.createPollingSocket(url);
    }
}, httpConfiguration);
var xhrConfiguration = {
    isSupported: function () {
        return runtime_1.default.isXHRSupported();
    }
};
var xdrConfiguration = {
    isSupported: function (environment) {
        var yes = runtime_1.default.isXDRSupported(environment.encrypted);
        return yes;
    }
};
var XHRStreamingTransport = new transport_ts_1.default(Collections.extend({}, streamingConfiguration, xhrConfiguration));
var XDRStreamingTransport = new transport_ts_1.default(Collections.extend({}, streamingConfiguration, xdrConfiguration));
var XHRPollingTransport = new transport_ts_1.default(Collections.extend({}, pollingConfiguration, xhrConfiguration));
var XDRPollingTransport = new transport_ts_1.default(Collections.extend({}, pollingConfiguration, xdrConfiguration));
var Transports = {
    WSTransport: WSTransport,
    SockJSTransport: SockJSTransport,
    XHRStreamingTransport: XHRStreamingTransport,
    XDRStreamingTransport: XDRStreamingTransport,
    XHRPollingTransport: XHRPollingTransport,
    XDRPollingTransport: XDRPollingTransport
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Transports;
//# sourceMappingURL=transports.js.map