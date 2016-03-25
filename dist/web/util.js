var Pusher =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	// var XHR = require('pusher-websocket-iso-externals-node/xhr');
	var timers_ts_1 = __webpack_require__(1);
	// var WSTransport = require('./transports/transports').WSTransport;
	// var WSTransport = {};
	var transports_ts_1 = __webpack_require__(2);
	var global = Function("return this")();
	function now() {
	    if (Date.now) {
	        return Date.now();
	    }
	    else {
	        return new Date().valueOf();
	    }
	}
	exports.now = now;
	function defer(callback) {
	    return new timers_ts_1.OneOffTimer(0, callback);
	}
	exports.defer = defer;
	/** Merges multiple objects into the target argument.
	 *
	 * For properties that are plain Objects, performs a deep-merge. For the
	 * rest it just copies the value of the property.
	 *
	 * To extend prototypes use it as following:
	 *   Pusher.Util.extend(Target.prototype, Base.prototype)
	 *
	 * You can also use it to merge objects without altering them:
	 *   Pusher.Util.extend({}, object1, object2)
	 *
	 * @param  {Object} target
	 * @return {Object} the target argument
	 */
	function extend(target) {
	    var sources = [];
	    for (var _i = 1; _i < arguments.length; _i++) {
	        sources[_i - 1] = arguments[_i];
	    }
	    var self = this;
	    for (var i = 0; i < sources.length; i++) {
	        var extensions = arguments[i];
	        for (var property in extensions) {
	            if (extensions[property] && extensions[property].constructor &&
	                extensions[property].constructor === Object) {
	                target[property] = self.extend(target[property] || {}, extensions[property]);
	            }
	            else {
	                target[property] = extensions[property];
	            }
	        }
	    }
	    return target;
	}
	exports.extend = extend;
	function stringify() {
	    var m = ["Pusher"];
	    for (var i = 0; i < arguments.length; i++) {
	        if (typeof arguments[i] === "string") {
	            m.push(arguments[i]);
	        }
	        else {
	            m.push(JSON.stringify(arguments[i]));
	        }
	    }
	    return m.join(" : ");
	}
	exports.stringify = stringify;
	function arrayIndexOf(array, item) {
	    var nativeIndexOf = Array.prototype.indexOf;
	    if (array === null) {
	        return -1;
	    }
	    if (nativeIndexOf && array.indexOf === nativeIndexOf) {
	        return array.indexOf(item);
	    }
	    for (var i = 0, l = array.length; i < l; i++) {
	        if (array[i] === item) {
	            return i;
	        }
	    }
	    return -1;
	}
	exports.arrayIndexOf = arrayIndexOf;
	/** Applies a function f to all properties of an object.
	 *
	 * Function f gets 3 arguments passed:
	 * - element from the object
	 * - key of the element
	 * - reference to the object
	 *
	 * @param {Object} object
	 * @param {Function} f
	 */
	function objectApply(object, f) {
	    for (var key in object) {
	        if (Object.prototype.hasOwnProperty.call(object, key)) {
	            f(object[key], key, object);
	        }
	    }
	}
	exports.objectApply = objectApply;
	/** Return a list of objects own proerty keys
	 *
	 * @param {Object} object
	 * @returns {Array}
	 */
	function keys(object) {
	    var keys = [];
	    objectApply(object, function (_, key) {
	        keys.push(key);
	    });
	    return keys;
	}
	exports.keys = keys;
	/** Return a list of object's own property values
	 *
	 * @param {Object} object
	 * @returns {Array}
	 */
	function values(object) {
	    var values = [];
	    objectApply(object, function (value) {
	        values.push(value);
	    });
	    return values;
	}
	exports.values = values;
	/** Applies a function f to all elements of an array.
	 *
	 * Function f gets 3 arguments passed:
	 * - element from the array
	 * - index of the element
	 * - reference to the array
	 *
	 * @param {Array} array
	 * @param {Function} f
	 */
	function apply(array, f, context) {
	    for (var i = 0; i < array.length; i++) {
	        f.call(context || global, array[i], i, array);
	    }
	}
	exports.apply = apply;
	/** Maps all elements of the array and returns the result.
	 *
	 * Function f gets 4 arguments passed:
	 * - element from the array
	 * - index of the element
	 * - reference to the source array
	 * - reference to the destination array
	 *
	 * @param {Array} array
	 * @param {Function} f
	 */
	function map(array, f) {
	    var result = [];
	    for (var i = 0; i < array.length; i++) {
	        result.push(f(array[i], i, array, result));
	    }
	    return result;
	}
	exports.map = map;
	/** Maps all elements of the object and returns the result.
	 *
	 * Function f gets 4 arguments passed:
	 * - element from the object
	 * - key of the element
	 * - reference to the source object
	 * - reference to the destination object
	 *
	 * @param {Object} object
	 * @param {Function} f
	 */
	function mapObject(object, f) {
	    var result = {};
	    objectApply(object, function (value, key) {
	        result[key] = f(value);
	    });
	    return result;
	}
	exports.mapObject = mapObject;
	/** Filters elements of the array using a test function.
	 *
	 * Function test gets 4 arguments passed:
	 * - element from the array
	 * - index of the element
	 * - reference to the source array
	 * - reference to the destination array
	 *
	 * @param {Array} array
	 * @param {Function} f
	 */
	function filter(array, test) {
	    test = test || function (value) { return !!value; };
	    var result = [];
	    for (var i = 0; i < array.length; i++) {
	        if (test(array[i], i, array, result)) {
	            result.push(array[i]);
	        }
	    }
	    return result;
	}
	exports.filter = filter;
	/** Filters properties of the object using a test function.
	 *
	 * Function test gets 4 arguments passed:
	 * - element from the object
	 * - key of the element
	 * - reference to the source object
	 * - reference to the destination object
	 *
	 * @param {Object} object
	 * @param {Function} f
	 */
	function filterObject(object, test) {
	    var result = {};
	    objectApply(object, function (value, key) {
	        if ((test && test(value, key, object, result)) || Boolean(value)) {
	            result[key] = value;
	        }
	    });
	    return result;
	}
	exports.filterObject = filterObject;
	/** Flattens an object into a two-dimensional array.
	 *
	 * @param  {Object} object
	 * @return {Array} resulting array of [key, value] pairs
	 */
	function flatten(object) {
	    var result = [];
	    objectApply(object, function (value, key) {
	        result.push([key, value]);
	    });
	    return result;
	}
	exports.flatten = flatten;
	/** Checks whether any element of the array passes the test.
	 *
	 * Function test gets 3 arguments passed:
	 * - element from the array
	 * - index of the element
	 * - reference to the source array
	 *
	 * @param {Array} array
	 * @param {Function} f
	 */
	function any(array, test) {
	    for (var i = 0; i < array.length; i++) {
	        if (test(array[i], i, array)) {
	            return true;
	        }
	    }
	    return false;
	}
	exports.any = any;
	/** Checks whether all elements of the array pass the test.
	 *
	 * Function test gets 3 arguments passed:
	 * - element from the array
	 * - index of the element
	 * - reference to the source array
	 *
	 * @param {Array} array
	 * @param {Function} f
	 */
	function all(array, test) {
	    for (var i = 0; i < array.length; i++) {
	        if (!test(array[i], i, array)) {
	            return false;
	        }
	    }
	    return true;
	}
	exports.all = all;
	/** Builds a function that will proxy a method call to its first argument.
	 *
	 * Allows partial application of arguments, so additional arguments are
	 * prepended to the argument list.
	 *
	 * @param  {String} name method name
	 * @return {Function} proxy function
	 */
	function method(name) {
	    var boundArguments = Array.prototype.slice.call(arguments, 1);
	    return function (object) {
	        return object[name].apply(object, boundArguments.concat(arguments));
	    };
	}
	exports.method = method;
	function getLocalStorage() {
	    try {
	        return window.localStorage;
	    }
	    catch (e) {
	        return undefined;
	    }
	}
	exports.getLocalStorage = getLocalStorage;
	function getClientFeatures() {
	    return keys(filterObject({ "ws": transports_ts_1.WSTransport }, function (t) { return t.isSupported({}); }));
	}
	exports.getClientFeatures = getClientFeatures;
	function isXHRSupported() {
	    return Boolean(XHR) && (new XHR()).withCredentials !== undefined;
	}
	exports.isXHRSupported = isXHRSupported;
	function isXDRSupported(encrypted) {
	    var protocol = encrypted ? "https:" : "http:";
	    var documentProtocol = this.getProtocol();
	    return Boolean('XDomainRequest' in window) && documentProtocol === protocol;
	}
	exports.isXDRSupported = isXDRSupported;
	function getProtocol() {
	    if (this.getDocument() !== undefined) {
	        return this.getDocument().location.protocol;
	    }
	    return "http:";
	}
	exports.getProtocol = getProtocol;
	function createXHR() {
	    if (XHR) {
	        return new XHR();
	    }
	    else {
	        return new ActiveXObject("Microsoft.XMLHTTP");
	    }
	}
	exports.createXHR = createXHR;


/***/ },
/* 1 */
/***/ function(module, exports) {

	/// <reference path="./abstract_timer.ts" />
	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var global = Function("return this")();
	// We need to bind clear functions this way to avoid exceptions on IE8
	function clearTimeout(timer) {
	    global.clearTimeout(timer);
	}
	function clearInterval(timer) {
	    global.clearInterval(timer);
	}
	/** Cross-browser compatible one-off timer abstraction.
	 *
	 * @param {Number} delay
	 * @param {Function} callback
	 */
	var OneOffTimer = (function (_super) {
	    __extends(OneOffTimer, _super);
	    function OneOffTimer(delay, callback) {
	        _super.call(this, setTimeout, clearTimeout, delay, function (timer) {
	            callback();
	            return null;
	        });
	    }
	    return OneOffTimer;
	}(Timer));
	exports.OneOffTimer = OneOffTimer;
	/** Cross-browser compatible periodic timer abstraction.
	 *
	 * @param {Number} delay
	 * @param {Function} callback
	 */
	var PeriodicTimer = (function (_super) {
	    __extends(PeriodicTimer, _super);
	    function PeriodicTimer(delay, callback) {
	        _super.call(this, setInterval, clearInterval, delay, function (timer) {
	            callback();
	            return timer;
	        });
	    }
	    return PeriodicTimer;
	}(Timer));
	exports.PeriodicTimer = PeriodicTimer;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var URLSchemes = __webpack_require__(3);
	var transport_ts_1 = __webpack_require__(5);
	var Util = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"../util.ts\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
	var ws_1 = __webpack_require__(6);
	var HTTP = __webpack_require__(7);
	/** WebSocket transport.
	 *
	 * Uses native WebSocket implementation, including MozWebSocket supported by
	 * earlier Firefox versions.
	 */
	exports.WSTransport = new transport_ts_1.default({
	    urls: URLSchemes.ws,
	    handlesActivityChecks: false,
	    supportsPing: false,
	    isInitialized: function () {
	        return Boolean(ws_1.default);
	    },
	    isSupported: function () {
	        return Boolean(ws_1.default);
	    },
	    getSocket: function (url) {
	        var Constructor = ws_1.default;
	        return new Constructor(url);
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
	var streamingConfiguration = Util.extend({ getSocket: function (url) {
	        return HTTP.getStreamingSocket(url);
	    }
	}, httpConfiguration);
	var pollingConfiguration = Util.extend({ getSocket: function (url) {
	        return HTTP.getPollingSocket(url);
	    }
	}, httpConfiguration);
	var xhrConfiguration = {
	    isSupported: Util.isXHRSupported
	};
	var xdrConfiguration = {
	    isSupported: function (environment) {
	        return Util.isXDRSupported(environment.encrypted);
	    }
	};
	/** HTTP streaming transport using CORS-enabled XMLHttpRequest. */
	exports.XHRStreamingTransport = new transport_ts_1.default(Util.extend({}, streamingConfiguration, xhrConfiguration));
	/** HTTP streaming transport using XDomainRequest (IE 8,9). */
	exports.XDRStreamingTransport = new transport_ts_1.default(Util.extend({}, streamingConfiguration, xdrConfiguration));
	/** HTTP long-polling transport using CORS-enabled XMLHttpRequest. */
	exports.XHRPollingTransport = new transport_ts_1.default(Util.extend({}, pollingConfiguration, xhrConfiguration));
	/** HTTP long-polling transport using XDomainRequest (IE 8,9). */
	exports.XDRPollingTransport = new transport_ts_1.default(Util.extend({}, pollingConfiguration, xdrConfiguration));


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var defaults_ts_1 = __webpack_require__(4);
	function getGenericURL(baseScheme, params, path) {
	    var scheme = baseScheme + (params.encrypted ? "s" : "");
	    var host = params.encrypted ? params.hostEncrypted : params.hostUnencrypted;
	    return scheme + "://" + host + path;
	}
	function getGenericPath(key, queryString) {
	    var path = "/app/" + key;
	    var query = "?protocol=" + defaults_ts_1.PROTOCOL +
	        "&client=js" +
	        "&version=" + defaults_ts_1.VERSION +
	        (queryString ? ("&" + queryString) : "");
	    return path + query;
	}
	exports.ws = {
	    getInitial: function (key, params) {
	        return getGenericURL("ws", params, getGenericPath(key, "flash=false"));
	    }
	};
	exports.http = {
	    getInitial: function (key, params) {
	        var path = (params.httpPath || "/pusher") + getGenericPath(key);
	        return getGenericURL("http", params, path);
	    }
	};


/***/ },
/* 4 */
/***/ function(module, exports) {

	"use strict";
	exports.VERSION = '4.0';
	exports.PROTOCOL = 7;
	// DEPRECATED: WS connection parameters
	exports.host = 'ws.pusherapp.com';
	exports.ws_port = 80;
	exports.wss_port = 443;
	// DEPRECATED: SockJS fallback parameters
	exports.sockjs_host = 'sockjs.pusher.com';
	exports.sockjs_http_port = 80;
	exports.sockjs_https_port = 443;
	exports.sockjs_path = "/pusher";
	// DEPRECATED: Stats
	exports.stats_host = 'stats.pusher.com';
	// DEPRECATED: Other settings
	exports.channel_auth_endpoint = '/pusher/auth';
	exports.channel_auth_transport = 'ajax';
	exports.activity_timeout = 120000;
	exports.pong_timeout = 30000;
	exports.unavailable_timeout = 10000;
	exports.getDefaultStrategy = function (config) {
	    var wsStrategy;
	    if (config.encrypted) {
	        wsStrategy = [
	            ":best_connected_ever",
	            ":ws_loop",
	            [":delayed", 2000, [":http_loop"]]
	        ];
	    }
	    else {
	        wsStrategy = [
	            ":best_connected_ever",
	            ":ws_loop",
	            [":delayed", 2000, [":wss_loop"]],
	            [":delayed", 5000, [":http_loop"]]
	        ];
	    }
	    return [
	        [":def", "ws_options", {
	                hostUnencrypted: config.wsHost + ":" + config.wsPort,
	                hostEncrypted: config.wsHost + ":" + config.wssPort
	            }],
	        [":def", "wss_options", [":extend", ":ws_options", {
	                    encrypted: true
	                }]],
	        [":def", "http_options", {
	                hostUnencrypted: config.httpHost + ":" + config.httpPort,
	                hostEncrypted: config.httpHost + ":" + config.httpsPort,
	                httpPath: config.httpPath
	            }],
	        [":def", "timeouts", {
	                loop: true,
	                timeout: 15000,
	                timeoutLimit: 60000
	            }],
	        [":def", "ws_manager", [":transport_manager", {
	                    lives: 2,
	                    minPingDelay: 10000,
	                    maxPingDelay: config.activity_timeout
	                }]],
	        [":def", "streaming_manager", [":transport_manager", {
	                    lives: 2,
	                    minPingDelay: 10000,
	                    maxPingDelay: config.activity_timeout
	                }]],
	        [":def_transport", "ws", "ws", 3, ":ws_options", ":ws_manager"],
	        [":def_transport", "wss", "ws", 3, ":wss_options", ":ws_manager"],
	        [":def_transport", "xhr_streaming", "xhr_streaming", 1, ":http_options", ":streaming_manager"],
	        [":def_transport", "xdr_streaming", "xdr_streaming", 1, ":http_options", ":streaming_manager"],
	        [":def_transport", "xhr_polling", "xhr_polling", 1, ":http_options"],
	        [":def_transport", "xdr_polling", "xdr_polling", 1, ":http_options"],
	        [":def", "ws_loop", [":sequential", ":timeouts", ":ws"]],
	        [":def", "wss_loop", [":sequential", ":timeouts", ":wss"]],
	        [":def", "streaming_loop", [":sequential", ":timeouts",
	                [":if", [":is_supported", ":xhr_streaming"],
	                    ":xhr_streaming",
	                    ":xdr_streaming"
	                ]
	            ]],
	        [":def", "polling_loop", [":sequential", ":timeouts",
	                [":if", [":is_supported", ":xhr_polling"],
	                    ":xhr_polling",
	                    ":xdr_polling"
	                ]
	            ]],
	        [":def", "http_loop", [":if", [":is_supported", ":streaming_loop"], [
	                    ":best_connected_ever",
	                    ":streaming_loop",
	                    [":delayed", 4000, [":polling_loop"]]
	                ], [
	                    ":polling_loop"
	                ]]],
	        [":def", "strategy",
	            [":cached", 1800000,
	                [":first_connected",
	                    [":if", [":is_supported", ":ws"],
	                        wsStrategy,
	                        ":http_loop"
	                    ]
	                ]
	            ]
	        ]
	    ];
	};


/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";
	/** Provides interface for transport connection instantiation.
	 *
	 * Takes transport-specific hooks as the only argument, which allow checking
	 * for transport support and creating its connections.
	 *
	 * Supported hooks: * - file - the name of the file to be fetched during initialization
	 * - urls - URL scheme to be used by transport
	 * - handlesActivityCheck - true when the transport handles activity checks
	 * - supportsPing - true when the transport has a ping/activity API
	 * - isSupported - tells whether the transport is supported in the environment
	 * - getSocket - creates a WebSocket-compatible transport socket
	 *
	 * See transports.js for specific implementations.
	 *
	 * @param {Object} hooks object containing all needed transport hooks
	 */
	var Transport = (function () {
	    function Transport(hooks) {
	        this.hooks = hooks;
	    }
	    /** Returns whether the transport is supported in the environment.
	     *
	     * @param {Object} envronment te environment details (encryption, settings)
	     * @returns {Boolean} true when the transport is supported
	     */
	    Transport.prototype.isSupported = function (environment) {
	        return this.hooks.isSupported(environment);
	    };
	    /** Creates a transport connection.
	     *
	     * @param {String} name
	     * @param {Number} priority
	     * @param {String} key the application key
	     * @param {Object} options
	     * @returns {TransportConnection}
	     */
	    Transport.prototype.createConnection = function (name, priority, key, options) {
	        return new TransportConnection(this.hooks, name, priority, key, options);
	    };
	    return Transport;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Transport;


/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = window.WebSocket || window.MozWebSocket;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var http_polling_socket_1 = __webpack_require__(8);
	exports.getPollingSocket = http_polling_socket_1.default;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var http_socket_1 = __webpack_require__(9);
	var hooks = {
	    getReceiveURL: function (url, session) {
	        return url.base + "/" + session + "/xhr" + url.queryString;
	    },
	    onHeartbeat: function () {
	        // next HTTP request will reset server's activity timer
	    },
	    sendHeartbeat: function (socket) {
	        socket.sendRaw("[]");
	    },
	    onFinished: function (socket, status) {
	        if (status === 200) {
	            socket.reconnect();
	        }
	        else {
	            socket.onClose(1006, "Connection interrupted (" + status + ")", false);
	        }
	    }
	};
	function default_1(url) {
	    return new http_socket_1.default(hooks, url);
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = default_1;
	;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var state_1 = __webpack_require__(10);
	var Util = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"../util\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
	var getXHR = __webpack_require__(11);
	var getXDR = __webpack_require__(16);
	var autoIncrement = 1;
	var HTTPSocket = (function () {
	    function HTTPSocket(hooks, url) {
	        this.hooks = hooks;
	        this.session = randomNumber(1000) + "/" + randomString(8);
	        this.location = getLocation(url);
	        this.readyState = state_1.default.CONNECTING;
	        this.openStream();
	    }
	    HTTPSocket.prototype.send = function (payload) {
	        return this.sendRaw(JSON.stringify([payload]));
	    };
	    HTTPSocket.prototype.ping = function () {
	        this.hooks.sendHeartbeat(this);
	    };
	    HTTPSocket.prototype.close = function (code, reason) {
	        this.onClose(code, reason, true);
	    };
	    /** For internal use only */
	    HTTPSocket.prototype.sendRaw = function (payload) {
	        if (this.readyState === state_1.default.OPEN) {
	            try {
	                createRequest("POST", getUniqueURL(getSendURL(this.location, this.session))).start(payload);
	                return true;
	            }
	            catch (e) {
	                return false;
	            }
	        }
	        else {
	            return false;
	        }
	    };
	    /** For internal use only */
	    HTTPSocket.prototype.reconnect = function () {
	        this.closeStream();
	        this.openStream();
	    };
	    ;
	    /** For internal use only */
	    HTTPSocket.prototype.onClose = function (code, reason, wasClean) {
	        this.closeStream();
	        this.readyState = state_1.default.CLOSED;
	        if (this.onclose) {
	            this.onclose({
	                code: code,
	                reason: reason,
	                wasClean: wasClean
	            });
	        }
	    };
	    /** @private */
	    HTTPSocket.prototype.onChunk = function (chunk) {
	        if (chunk.status !== 200) {
	            return;
	        }
	        if (this.readyState === state_1.default.OPEN) {
	            this.onActivity();
	        }
	        var payload;
	        var type = chunk.data.slice(0, 1);
	        switch (type) {
	            case 'o':
	                payload = JSON.parse(chunk.data.slice(1) || '{}');
	                this.onOpen(payload);
	                break;
	            case 'a':
	                payload = JSON.parse(chunk.data.slice(1) || '[]');
	                for (var i = 0; i < payload.length; i++) {
	                    this.onEvent(payload[i]);
	                }
	                break;
	            case 'm':
	                payload = JSON.parse(chunk.data.slice(1) || 'null');
	                this.onEvent(payload);
	                break;
	            case 'h':
	                this.hooks.onHeartbeat(this);
	                break;
	            case 'c':
	                payload = JSON.parse(chunk.data.slice(1) || '[]');
	                this.onClose(payload[0], payload[1], true);
	                break;
	        }
	    };
	    /** @private */
	    HTTPSocket.prototype.onOpen = function (options) {
	        if (this.readyState === state_1.default.CONNECTING) {
	            if (options && options.hostname) {
	                this.location.base = replaceHost(this.location.base, options.hostname);
	            }
	            this.readyState = state_1.default.OPEN;
	            if (this.onopen) {
	                this.onopen();
	            }
	        }
	        else {
	            this.onClose(1006, "Server lost session", true);
	        }
	    };
	    /** @private */
	    HTTPSocket.prototype.onEvent = function (event) {
	        if (this.readyState === state_1.default.OPEN && this.onmessage) {
	            this.onmessage({ data: event });
	        }
	    };
	    /** @private */
	    HTTPSocket.prototype.onActivity = function () {
	        if (this.onactivity) {
	            this.onactivity();
	        }
	    };
	    /** @private */
	    HTTPSocket.prototype.onError = function (error) {
	        if (this.onerror) {
	            this.onerror(error);
	        }
	    };
	    /** @private */
	    HTTPSocket.prototype.openStream = function () {
	        var self = this;
	        self.stream = createRequest("POST", getUniqueURL(self.hooks.getReceiveURL(self.location, self.session)));
	        self.stream.bind("chunk", function (chunk) {
	            self.onChunk(chunk);
	        });
	        self.stream.bind("finished", function (status) {
	            self.hooks.onFinished(self, status);
	        });
	        self.stream.bind("buffer_too_long", function () {
	            self.reconnect();
	        });
	        try {
	            self.stream.start();
	        }
	        catch (error) {
	            Util.defer(function () {
	                self.onError(error);
	                self.onClose(1006, "Could not start streaming", false);
	            });
	        }
	    };
	    /** @private */
	    HTTPSocket.prototype.closeStream = function () {
	        if (this.stream) {
	            this.stream.unbind_all();
	            this.stream.close();
	            this.stream = null;
	        }
	    };
	    return HTTPSocket;
	}());
	function getLocation(url) {
	    var parts = /([^\?]*)\/*(\??.*)/.exec(url);
	    return {
	        base: parts[1],
	        queryString: parts[2]
	    };
	}
	function getSendURL(url, session) {
	    return url.base + "/" + session + "/xhr_send";
	}
	function getUniqueURL(url) {
	    var separator = (url.indexOf('?') === -1) ? "?" : "&";
	    return url + separator + "t=" + (+new Date()) + "&n=" + autoIncrement++;
	}
	function replaceHost(url, hostname) {
	    var urlParts = /(https?:\/\/)([^\/:]+)((\/|:)?.*)/.exec(url);
	    return urlParts[1] + hostname + urlParts[3];
	}
	function randomNumber(max) {
	    return Math.floor(Math.random() * max);
	}
	function randomString(length) {
	    var result = [];
	    for (var i = 0; i < length; i++) {
	        result.push(randomNumber(32).toString(32));
	    }
	    return result.join('');
	}
	function createRequest(method, url) {
	    if (Util.isXHRSupported()) {
	        return getXHR(method, url);
	    }
	    else if (Util.isXDRSupported(url.indexOf("https:") === 0)) {
	        return getXDR(method, url);
	    }
	    else {
	        throw "Cross-origin HTTP requests are not supported";
	    }
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = HTTPSocket;


/***/ },
/* 10 */
/***/ function(module, exports) {

	"use strict";
	var State;
	(function (State) {
	    State[State["CONNECTING"] = 0] = "CONNECTING";
	    State[State["OPEN"] = 1] = "OPEN";
	    State[State["CLOSED"] = 3] = "CLOSED";
	})(State || (State = {}));
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = State;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var HTTPRequest = __webpack_require__(12);
	var XHR = __webpack_require__(15);

	var hooks = {
	  getRequest: function(socket) {
	    var xhr = new XHR();
	    xhr.onreadystatechange = xhr.onprogress = function() {
	      switch (xhr.readyState) {
	        case 3:
	          if (xhr.responseText && xhr.responseText.length > 0) {
	            socket.onChunk(xhr.status, xhr.responseText);
	          }
	          break;
	        case 4:
	          // this happens only on errors, never after calling close
	          if (xhr.responseText && xhr.responseText.length > 0) {
	            socket.onChunk(xhr.status, xhr.responseText);
	          }
	          socket.emit("finished", xhr.status);
	          socket.close();
	          break;
	      }
	    };
	    return xhr;
	  },
	  abortRequest: function(xhr) {
	    xhr.onreadystatechange = null;
	    xhr.abort();
	  }
	};

	module.exports = getXHR = function(method, url) {
	  return new HTTPRequest(hooks, method, url);
	};


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var App = __webpack_require__(13);

	var EventsDispatcher = __webpack_require__(14);
	var Util = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"../util\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

	var MAX_BUFFER_LENGTH = 256*1024;

	function HTTPRequest(hooks, method, url) {
	  EventsDispatcher.call(this);

	  this.hooks = hooks;
	  this.method = method;
	  this.url = url;
	}
	var prototype = HTTPRequest.prototype;
	Util.extend(prototype, EventsDispatcher.prototype);

	prototype.start = function(payload) {
	  var self = this;

	  self.position = 0;
	  self.xhr = self.hooks.getRequest(self);

	  self.unloader = function() {
	    self.close();
	  };
	  App.addUnloadListener(self.unloader);

	  self.xhr.open(self.method, self.url, true);
	  self.xhr.send(payload);
	};

	prototype.close = function() {
	  if (this.unloader) {
	    App.removeUnloadListener(this.unloader);
	    this.unloader = null;
	  }
	  if (this.xhr) {
	    this.hooks.abortRequest(this.xhr);
	    this.xhr = null;
	  }
	};

	prototype.onChunk = function(status, data) {
	  while (true) {
	    var chunk = this.advanceBuffer(data);
	    if (chunk) {
	      this.emit("chunk", { status: status, data: chunk });
	    } else {
	      break;
	    }
	  }
	  if (this.isBufferTooLong(data)) {
	    this.emit("buffer_too_long");
	  }
	};

	prototype.advanceBuffer = function(buffer) {
	  var unreadData = buffer.slice(this.position);
	  var endOfLinePosition = unreadData.indexOf("\n");

	  if (endOfLinePosition !== -1) {
	    this.position += endOfLinePosition + 1;
	    return unreadData.slice(0, endOfLinePosition);
	  } else {
	    // chunk is not finished yet, don't move the buffer pointer
	    return null;
	  }
	};

	prototype.isBufferTooLong = function(buffer) {
	  return this.position === buffer.length && buffer.length > MAX_BUFFER_LENGTH;
	};

	module.exports = HTTPRequest;


/***/ },
/* 13 */
/***/ function(module, exports) {

	exports.addUnloadListener = function(listener) {
	  if (window.addEventListener !== undefined) {
	    window.addEventListener("unload", listener, false);
	  } else if (window.attachEvent !== undefined) {
	    window.attachEvent("onunload", listener);
	  }
	};

	exports.removeUnloadListener = function(listener) {
	  if (window.addEventListener !== undefined) {
	    window.removeEventListener("unload", listener, false);
	  } else if (window.detachEvent !== undefined) {
	    window.detachEvent("onunload", listener);
	  }
	};


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var Util = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"./util\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

	/** Manages callback bindings and event emitting.
	 *
	 * @param Function failThrough called when no listeners are bound to an event
	 */
	function EventsDispatcher(failThrough) {
	  this.callbacks = new CallbackRegistry();
	  this.global_callbacks = [];
	  this.failThrough = failThrough;
	}
	var prototype = EventsDispatcher.prototype;

	prototype.bind = function(eventName, callback, context) {
	  this.callbacks.add(eventName, callback, context);
	  return this;
	};

	prototype.bind_all = function(callback) {
	  this.global_callbacks.push(callback);
	  return this;
	};

	prototype.unbind = function(eventName, callback, context) {
	  this.callbacks.remove(eventName, callback, context);
	  return this;
	};

	prototype.unbind_all = function(eventName, callback) {
	  this.callbacks.remove(eventName, callback);
	  return this;
	};

	prototype.emit = function(eventName, data) {
	  var i;

	  for (i = 0; i < this.global_callbacks.length; i++) {
	    this.global_callbacks[i](eventName, data);
	  }

	  var callbacks = this.callbacks.get(eventName);
	  if (callbacks && callbacks.length > 0) {
	    for (i = 0; i < callbacks.length; i++) {
	      callbacks[i].fn.call(callbacks[i].context || global, data);
	    }
	  } else if (this.failThrough) {
	    this.failThrough(eventName, data);
	  }

	  return this;
	};

	/** Callback registry helper. */

	function CallbackRegistry() {
	  this._callbacks = {};
	}

	CallbackRegistry.prototype.get = function(name) {
	  return this._callbacks[prefix(name)];
	};

	CallbackRegistry.prototype.add = function(name, callback, context) {
	  var prefixedEventName = prefix(name);
	  this._callbacks[prefixedEventName] = this._callbacks[prefixedEventName] || [];
	  this._callbacks[prefixedEventName].push({
	    fn: callback,
	    context: context
	  });
	};

	CallbackRegistry.prototype.remove = function(name, callback, context) {
	  if (!name && !callback && !context) {
	    this._callbacks = {};
	    return;
	  }

	  var names = name ? [prefix(name)] : Util.keys(this._callbacks);

	  if (callback || context) {
	    Util.apply(names, function(name) {
	      this._callbacks[name] = Util.filter(
	        this._callbacks[name] || [],
	        function(binding) {
	          return (callback && callback !== binding.fn) ||
	                 (context && context !== binding.context);
	        }
	      );
	      if (this._callbacks[name].length === 0) {
	        delete this._callbacks[name];
	      }
	    }, this);
	  } else {
	    Util.apply(names, function(name) {
	      delete this._callbacks[name];
	    }, this);
	  }
	};

	function prefix(name) {
	  return "_" + name;
	}

	module.exports = EventsDispatcher;

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 15 */
/***/ function(module, exports) {

	module.exports = window.XMLHttpRequest;


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var HTTPRequest = __webpack_require__(12);

	var hooks = {
	  getRequest: function(socket) {
	    var xdr = new window.XDomainRequest();
	    xdr.ontimeout = function() {
	      socket.emit("error", new Pusher.Errors.RequestTimedOut());
	      socket.close();
	    };
	    xdr.onerror = function(e) {
	      socket.emit("error", e);
	      socket.close();
	    };
	    xdr.onprogress = function() {
	      if (xdr.responseText && xdr.responseText.length > 0) {
	        socket.onChunk(200, xdr.responseText);
	      }
	    };
	    xdr.onload = function() {
	      if (xdr.responseText && xdr.responseText.length > 0) {
	        socket.onChunk(200, xdr.responseText);
	      }
	      socket.emit("finished", 200);
	      socket.close();
	    };
	    return xdr;
	  },
	  abortRequest: function(xdr) {
	    xdr.ontimeout = xdr.onerror = xdr.onprogress = xdr.onload = null;
	    xdr.abort();
	  }
	};

	module.exports = getXDR = function(method, url) {
	  return new HTTPRequest(hooks, method, url);
	};


/***/ }
/******/ ]);