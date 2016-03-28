var Pusher =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].e;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			e: {},
/******/ 			i: moduleId,
/******/ 			l: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.e, module, module.e, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.e;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 47);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var global = Function("return this")();
	var base64_1 = __webpack_require__(28);
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
	        var extensions = sources[i];
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
	function encodeParamsObject(data) {
	    return mapObject(data, function (value) {
	        if (typeof value === "object") {
	            value = JSON.stringify(value);
	        }
	        return encodeURIComponent(base64_1.default(value.toString()));
	    });
	}
	exports.encodeParamsObject = encodeParamsObject;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var timers_1 = __webpack_require__(6);
	var Util = {
	    now: function () {
	        if (Date.now) {
	            return Date.now();
	        }
	        else {
	            return new Date().valueOf();
	        }
	    },
	    defer: function (callback) {
	        return new timers_1.OneOffTimer(0, callback);
	    },
	    /** Builds a function that will proxy a method call to its first argument.
	    *
	    * Allows partial application of arguments, so additional arguments are
	    * prepended to the argument list.
	    *
	    * @param  {String} name method name
	    * @return {Function} proxy function
	    */
	    method: function (name) {
	        var args = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            args[_i - 1] = arguments[_i];
	        }
	        var boundArguments = Array.prototype.slice.call(arguments, 1);
	        return function (object) {
	            return object[name].apply(object, boundArguments.concat(arguments));
	        };
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Util;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var assistant_to_the_transport_manager_1 = __webpack_require__(61);
	var handshake_1 = __webpack_require__(34);
	var pusher_authorizer_1 = __webpack_require__(48);
	var timeline_sender_1 = __webpack_require__(60);
	var presence_channel_1 = __webpack_require__(31);
	var private_channel_1 = __webpack_require__(16);
	var channel_1 = __webpack_require__(15);
	var connection_manager_1 = __webpack_require__(33);
	var xhr_1 = __webpack_require__(12);
	var channels_1 = __webpack_require__(29);
	var net_info_1 = __webpack_require__(46);
	var ws_1 = __webpack_require__(20);
	var jsonp_request_1 = __webpack_require__(51);
	var script_request_1 = __webpack_require__(52);
	var Factory = {
	    createXHR: function () {
	        if (xhr_1.default.getAPI()) {
	            return this.createXMLHttpRequest();
	        }
	        else {
	            return this.createMicrosoftXHR();
	        }
	    },
	    createXMLHttpRequest: function () {
	        var Constructor = xhr_1.default.getAPI();
	        return new Constructor();
	    },
	    createMicrosoftXHR: function () {
	        return new ActiveXObject("Microsoft.XMLHTTP");
	    },
	    createChannels: function () {
	        return new channels_1.default();
	    },
	    createConnectionManager: function (key, options) {
	        return new connection_manager_1.default(key, options);
	    },
	    createChannel: function (name, pusher) {
	        return new channel_1.default(name, pusher);
	    },
	    createPrivateChannel: function (name, pusher) {
	        return new private_channel_1.default(name, pusher);
	    },
	    createPresenceChannel: function (name, pusher) {
	        return new presence_channel_1.default(name, pusher);
	    },
	    createTimelineSender: function (timeline, options) {
	        return new timeline_sender_1.default(timeline, options);
	    },
	    createAuthorizer: function (channel, options) {
	        return new pusher_authorizer_1.default(channel, options);
	    },
	    createHandshake: function (transport, callback) {
	        return new handshake_1.default(transport, callback);
	    },
	    /* RETRIEVE APIS */
	    getNetwork: function () {
	        return net_info_1.Network;
	    },
	    createWebSocket: function (url) {
	        var Constructor = ws_1.default.getAPI();
	        return new Constructor(url);
	    },
	    createAssistantToTheTransportManager: function (manager, transport, options) {
	        return new assistant_to_the_transport_manager_1.default(manager, transport, options);
	    },
	    createJSONPRequest: function (url, data) {
	        return new jsonp_request_1.default(url, data);
	    },
	    createScriptRequest: function (src) {
	        return new script_request_1.default(src);
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Factory;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var callback_registry_1 = __webpack_require__(36);
	var global = Function("return this")();
	/** Manages callback bindings and event emitting.
	 *
	 * @param Function failThrough called when no listeners are bound to an event
	 */
	var Dispatcher = (function () {
	    function Dispatcher(failThrough) {
	        this.callbacks = new callback_registry_1.default();
	        this.global_callbacks = [];
	        this.failThrough = failThrough;
	    }
	    Dispatcher.prototype.bind = function (eventName, callback, context) {
	        this.callbacks.add(eventName, callback, context);
	        return this;
	    };
	    Dispatcher.prototype.bind_all = function (callback) {
	        this.global_callbacks.push(callback);
	        return this;
	    };
	    Dispatcher.prototype.unbind = function (eventName, callback, context) {
	        this.callbacks.remove(eventName, callback, context);
	        return this;
	    };
	    Dispatcher.prototype.unbind_all = function (eventName, callback) {
	        this.callbacks.remove(eventName, callback);
	        return this;
	    };
	    Dispatcher.prototype.emit = function (eventName, data) {
	        var i;
	        for (i = 0; i < this.global_callbacks.length; i++) {
	            this.global_callbacks[i](eventName, data);
	        }
	        var callbacks = this.callbacks.get(eventName);
	        if (callbacks && callbacks.length > 0) {
	            for (i = 0; i < callbacks.length; i++) {
	                callbacks[i].fn.call(callbacks[i].context || global, data);
	            }
	        }
	        else if (this.failThrough) {
	            this.failThrough(eventName, data);
	        }
	        return this;
	    };
	    return Dispatcher;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Dispatcher;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var collections_1 = __webpack_require__(0);
	var Logger = {
	    log: null,
	    debug: function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i - 0] = arguments[_i];
	        }
	        if (!this.log) {
	            return;
	        }
	        this.log(collections_1.stringify.apply(this, arguments));
	    },
	    warn: function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i - 0] = arguments[_i];
	        }
	        var message = collections_1.stringify.apply(this, arguments);
	        if (console.warn) {
	            console.warn(message);
	        }
	        else if (console.log) {
	            console.log(message);
	        }
	        if (this.log) {
	            this.log(message);
	        }
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Logger;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var browser_1 = __webpack_require__(49);
	var isomorphic_1 = __webpack_require__(53);
	function decide() {
	    if (typeof (window) !== 'undefined' && typeof ((window).document) !== 'undefined') {
	        return new browser_1.default();
	    }
	    else {
	        return new isomorphic_1.default();
	    }
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = decide();


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var abstract_timer_1 = __webpack_require__(66);
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
	}(abstract_timer_1.default));
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
	}(abstract_timer_1.default));
	exports.PeriodicTimer = PeriodicTimer;


/***/ },
/* 7 */
/***/ function(module, exports) {

	"use strict";
	var Defaults = {};
	Defaults.VERSION = '4.0';
	Defaults.PROTOCOL = 7;
	// DEPRECATED: WS connection parameters
	Defaults.host = 'ws.pusherapp.com';
	Defaults.ws_port = 80;
	Defaults.wss_port = 443;
	// DEPRECATED: SockJS fallback parameters
	Defaults.sockjs_host = 'sockjs.pusher.com';
	Defaults.sockjs_http_port = 80;
	Defaults.sockjs_https_port = 443;
	Defaults.sockjs_path = "/pusher";
	// DEPRECATED: Stats
	Defaults.stats_host = 'stats.pusher.com';
	// DEPRECATED: Other settings
	Defaults.channel_auth_endpoint = '/pusher/auth';
	Defaults.channel_auth_transport = 'ajax';
	Defaults.activity_timeout = 120000;
	Defaults.pong_timeout = 30000;
	Defaults.unavailable_timeout = 10000;
	// CDN configuration
	Defaults.cdn_http = '<CDN_HTTP>';
	Defaults.cdn_https = '<CDN_HTTPS>';
	Defaults.dependency_suffix = '<DEPENDENCY_SUFFIX>';
	Defaults.getDefaultStrategy = function (config) {
	    var wsStrategy;
	    if (config.encrypted) {
	        wsStrategy = [
	            ":best_connected_ever",
	            ":ws_loop",
	            [":delayed", 2000, [":http_fallback_loop"]]
	        ];
	    }
	    else {
	        wsStrategy = [
	            ":best_connected_ever",
	            ":ws_loop",
	            [":delayed", 2000, [":wss_loop"]],
	            [":delayed", 5000, [":http_fallback_loop"]]
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
	        [":def", "sockjs_options", {
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
	        [":def_transport", "sockjs", "sockjs", 1, ":sockjs_options"],
	        [":def_transport", "xhr_streaming", "xhr_streaming", 1, ":sockjs_options", ":streaming_manager"],
	        [":def_transport", "xdr_streaming", "xdr_streaming", 1, ":sockjs_options", ":streaming_manager"],
	        [":def_transport", "xhr_polling", "xhr_polling", 1, ":sockjs_options"],
	        [":def_transport", "xdr_polling", "xdr_polling", 1, ":sockjs_options"],
	        [":def", "ws_loop", [":sequential", ":timeouts", ":ws"]],
	        [":def", "wss_loop", [":sequential", ":timeouts", ":wss"]],
	        [":def", "sockjs_loop", [":sequential", ":timeouts", ":sockjs"]],
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
	        [":def", "http_fallback_loop",
	            [":if", [":is_supported", ":http_loop"], [
	                    ":http_loop"
	                ], [
	                    ":sockjs_loop"
	                ]]
	        ],
	        [":def", "strategy",
	            [":cached", 1800000,
	                [":first_connected",
	                    [":if", [":is_supported", ":ws"],
	                        wsStrategy,
	                        ":http_fallback_loop"
	                    ]
	                ]
	            ]
	        ]
	    ];
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Defaults;


/***/ },
/* 8 */
/***/ function(module, exports) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	/** Error classes used throughout the library. */
	var BadEventName = (function (_super) {
	    __extends(BadEventName, _super);
	    function BadEventName() {
	        _super.apply(this, arguments);
	    }
	    return BadEventName;
	}(Error));
	exports.BadEventName = BadEventName;
	var RequestTimedOut = (function (_super) {
	    __extends(RequestTimedOut, _super);
	    function RequestTimedOut() {
	        _super.apply(this, arguments);
	    }
	    return RequestTimedOut;
	}(Error));
	exports.RequestTimedOut = RequestTimedOut;
	var TransportPriorityTooLow = (function (_super) {
	    __extends(TransportPriorityTooLow, _super);
	    function TransportPriorityTooLow() {
	        _super.apply(this, arguments);
	    }
	    return TransportPriorityTooLow;
	}(Error));
	exports.TransportPriorityTooLow = TransportPriorityTooLow;
	var TransportClosed = (function (_super) {
	    __extends(TransportClosed, _super);
	    function TransportClosed() {
	        _super.apply(this, arguments);
	    }
	    return TransportClosed;
	}(Error));
	exports.TransportClosed = TransportClosed;
	var UnsupportedTransport = (function (_super) {
	    __extends(UnsupportedTransport, _super);
	    function UnsupportedTransport() {
	        _super.apply(this, arguments);
	    }
	    return UnsupportedTransport;
	}(Error));
	exports.UnsupportedTransport = UnsupportedTransport;
	var UnsupportedStrategy = (function (_super) {
	    __extends(UnsupportedStrategy, _super);
	    function UnsupportedStrategy() {
	        _super.apply(this, arguments);
	    }
	    return UnsupportedStrategy;
	}(Error));
	exports.UnsupportedStrategy = UnsupportedStrategy;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var script_receiver_factory_1 = __webpack_require__(10);
	var defaults_1 = __webpack_require__(7);
	var dependency_loader_1 = __webpack_require__(50);
	exports.DependenciesReceivers = new script_receiver_factory_1.ScriptReceiverFactory("_pusher_dependencies", "Pusher.Runtime.DependenciesReceivers");
	exports.Dependencies = new dependency_loader_1.default({
	    cdn_http: defaults_1.default.cdn_http,
	    cdn_https: defaults_1.default.cdn_https,
	    version: defaults_1.default.VERSION,
	    suffix: defaults_1.default.dependency_suffix,
	    receivers: exports.DependenciesReceivers
	});


/***/ },
/* 10 */
/***/ function(module, exports) {

	"use strict";
	/** Builds receivers for JSONP and Script requests.
	 *
	 * Each receiver is an object with following fields:
	 * - number - unique (for the factory instance), numerical id of the receiver
	 * - id - a string ID that can be used in DOM attributes
	 * - name - name of the function triggering the receiver
	 * - callback - callback function
	 *
	 * Receivers are triggered only once, on the first callback call.
	 *
	 * Receivers can be called by their name or by accessing factory object
	 * by the number key.
	 *
	 * @param {String} prefix the prefix used in ids
	 * @param {String} name the name of the object
	 */
	var ScriptReceiverFactory = (function () {
	    function ScriptReceiverFactory(prefix, name) {
	        this.lastId = 0;
	        this.prefix = prefix;
	        this.name = name;
	    }
	    ScriptReceiverFactory.prototype.create = function (callback) {
	        this.lastId++;
	        var number = this.lastId;
	        var id = this.prefix + number;
	        var name = this.name + "[" + number + "]";
	        var called = false;
	        var callbackWrapper = function () {
	            if (!called) {
	                callback.apply(null, arguments);
	                called = true;
	            }
	        };
	        this[number] = callbackWrapper;
	        return { number: number, id: id, name: name, callback: callbackWrapper };
	    };
	    ScriptReceiverFactory.prototype.remove = function (receiver) {
	        delete this[receiver.number];
	    };
	    return ScriptReceiverFactory;
	}());
	exports.ScriptReceiverFactory = ScriptReceiverFactory;
	exports.ScriptReceivers = new ScriptReceiverFactory("_pusher_script_", "Pusher.Runtime.ScriptReceivers");


/***/ },
/* 11 */
/***/ function(module, exports) {

	"use strict";
	var ConnectionState;
	(function (ConnectionState) {
	    ConnectionState[ConnectionState["OPEN"] = "open"] = "OPEN";
	    ConnectionState[ConnectionState["CLOSED"] = "closed"] = "CLOSED";
	    ConnectionState[ConnectionState["NEW"] = "new"] = "NEW";
	    ConnectionState[ConnectionState["INITIALIZED"] = "initialized"] = "INITIALIZED";
	    ConnectionState[ConnectionState["INITIALIZING"] = "initializing"] = "INITIALIZING";
	    ConnectionState[ConnectionState["CONNECTING"] = "connecting"] = "CONNECTING";
	    ConnectionState[ConnectionState["FAILED"] = "failed"] = "FAILED";
	    ConnectionState[ConnectionState["DISCONNECTED"] = "disconnected"] = "DISCONNECTED";
	    ConnectionState[ConnectionState["UNAVAILABLE"] = "unavailable"] = "UNAVAILABLE";
	    ConnectionState[ConnectionState["CONNECTED"] = "connected"] = "CONNECTED";
	})(ConnectionState || (ConnectionState = {}));
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = ConnectionState;


/***/ },
/* 12 */
/***/ function(module, exports) {

	"use strict";
	var XHR = {
	    getAPI: function () {
	        return XMLHttpRequest;
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = XHR;


/***/ },
/* 13 */
/***/ function(module, exports) {

	"use strict";
	var TimelineLevel;
	(function (TimelineLevel) {
	    TimelineLevel[TimelineLevel["ERROR"] = 3] = "ERROR";
	    TimelineLevel[TimelineLevel["INFO"] = 6] = "INFO";
	    TimelineLevel[TimelineLevel["DEBUG"] = 7] = "DEBUG";
	})(TimelineLevel || (TimelineLevel = {}));
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = TimelineLevel;


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var logger_1 = __webpack_require__(4);
	var factory_1 = __webpack_require__(2);
	var ajax = function (context, socketId, callback) {
	    var self = this, xhr;
	    xhr = factory_1.default.createXHR();
	    xhr.open("POST", self.options.authEndpoint, true);
	    // add request headers
	    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	    for (var headerName in this.authOptions.headers) {
	        xhr.setRequestHeader(headerName, this.authOptions.headers[headerName]);
	    }
	    xhr.onreadystatechange = function () {
	        if (xhr.readyState === 4) {
	            if (xhr.status === 200) {
	                var data, parsed = false;
	                try {
	                    data = JSON.parse(xhr.responseText);
	                    parsed = true;
	                }
	                catch (e) {
	                    callback(true, 'JSON returned from webapp was invalid, yet status code was 200. Data was: ' + xhr.responseText);
	                }
	                if (parsed) {
	                    callback(false, data);
	                }
	            }
	            else {
	                logger_1.default.warn("Couldn't get auth info from your webapp", xhr.status);
	                callback(true, xhr.status);
	            }
	        }
	    };
	    xhr.send(this.composeQuery(socketId));
	    return xhr;
	};
	exports.ajax = ajax;
	var jsonp = function (context, socketId, callback) {
	    if (this.authOptions.headers !== undefined) {
	        logger_1.default.warn("Warn", "To send headers with the auth request, you must use AJAX, rather than JSONP.");
	    }
	    var callbackName = context.nextAuthCallbackID.toString();
	    context.nextAuthCallbackID++;
	    var document = context.getDocument();
	    var script = document.createElement("script");
	    // Hacked wrapper.
	    context.auth_callbacks[callbackName] = function (data) {
	        callback(false, data);
	    };
	    var callback_name = "Pusher.Runtime.auth_callbacks['" + callbackName + "']";
	    script.src = this.options.authEndpoint +
	        '?callback=' +
	        encodeURIComponent(callback_name) +
	        '&' +
	        this.composeQuery(socketId);
	    var head = document.getElementsByTagName("head")[0] || document.documentElement;
	    head.insertBefore(script, head.firstChild);
	};
	exports.jsonp = jsonp;


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var dispatcher_1 = __webpack_require__(3);
	var Errors = __webpack_require__(8);
	var logger_1 = __webpack_require__(4);
	/** Provides base public channel interface with an event emitter.
	 *
	 * Emits:
	 * - pusher:subscription_succeeded - after subscribing successfully
	 * - other non-internal events
	 *
	 * @param {String} name
	 * @param {Pusher} pusher
	 */
	var Channel = (function (_super) {
	    __extends(Channel, _super);
	    function Channel(name, pusher) {
	        _super.call(this, function (event, data) {
	            logger_1.default.debug('No callbacks on ' + name + ' for ' + event);
	        });
	        this.name = name;
	        this.pusher = pusher;
	        this.subscribed = false;
	    }
	    /** Skips authorization, since public channels don't require it.
	     *
	     * @param {Function} callback
	     */
	    Channel.prototype.authorize = function (socketId, callback) {
	        return callback(false, {});
	    };
	    /** Triggers an event */
	    Channel.prototype.trigger = function (event, data) {
	        if (event.indexOf("client-") !== 0) {
	            throw new Errors.BadEventName("Event '" + event + "' does not start with 'client-'");
	        }
	        return this.pusher.send_event(event, data, this.name);
	    };
	    /** Signals disconnection to the channel. For internal use only. */
	    Channel.prototype.disconnect = function () {
	        this.subscribed = false;
	    };
	    /** Handles an event. For internal use only.
	     *
	     * @param {String} event
	     * @param {*} data
	     */
	    Channel.prototype.handleEvent = function (event, data) {
	        if (event.indexOf("pusher_internal:") === 0) {
	            if (event === "pusher_internal:subscription_succeeded") {
	                this.subscribed = true;
	                this.emit("pusher:subscription_succeeded", data);
	            }
	        }
	        else {
	            this.emit(event, data);
	        }
	    };
	    /** Sends a subscription request. For internal use only. */
	    Channel.prototype.subscribe = function () {
	        var _this = this;
	        this.authorize(this.pusher.connection.socket_id, function (error, data) {
	            if (error) {
	                _this.handleEvent('pusher:subscription_error', data);
	            }
	            else {
	                _this.pusher.send_event('pusher:subscribe', {
	                    auth: data.auth,
	                    channel_data: data.channel_data,
	                    channel: _this.name
	                });
	            }
	        });
	    };
	    /** Sends an unsubscription request. For internal use only. */
	    Channel.prototype.unsubscribe = function () {
	        this.pusher.send_event('pusher:unsubscribe', {
	            channel: this.name
	        });
	    };
	    return Channel;
	}(dispatcher_1.default));
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Channel;


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var factory_1 = __webpack_require__(2);
	var channel_1 = __webpack_require__(15);
	/** Extends public channels to provide private channel interface.
	 *
	 * @param {String} name
	 * @param {Pusher} pusher
	 */
	var PrivateChannel = (function (_super) {
	    __extends(PrivateChannel, _super);
	    function PrivateChannel() {
	        _super.apply(this, arguments);
	    }
	    /** Authorizes the connection to use the channel.
	     *
	     * @param  {String} socketId
	     * @param  {Function} callback
	     */
	    PrivateChannel.prototype.authorize = function (socketId, callback) {
	        var authorizer = factory_1.default.createAuthorizer(this, this.pusher.config);
	        return authorizer.authorize(socketId, callback);
	    };
	    return PrivateChannel;
	}(channel_1.default));
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = PrivateChannel;


/***/ },
/* 17 */
/***/ function(module, exports) {

	"use strict";
	var HandshakeResults;
	(function (HandshakeResults) {
	    HandshakeResults[HandshakeResults["CONNECTED"] = "connected"] = "CONNECTED";
	    HandshakeResults[HandshakeResults["BACKOFF"] = "backoff"] = "BACKOFF";
	    HandshakeResults[HandshakeResults["SSL_ONLY"] = "ssl_only"] = "SSL_ONLY";
	    HandshakeResults[HandshakeResults["REFUSED"] = "refused"] = "REFUSED";
	    HandshakeResults[HandshakeResults["RETRY"] = "retry"] = "RETRY";
	})(HandshakeResults || (HandshakeResults = {}));
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = HandshakeResults;


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var internal_events_1 = __webpack_require__(35);
	var handshake_results_1 = __webpack_require__(17);
	/**
	 * Provides functions for handling Pusher protocol-specific messages.
	 */
	/**
	 * Decodes a message in a Pusher format.
	 *
	 * Throws errors when messages are not parse'able.
	 *
	 * @param  {Object} message
	 * @return {Object}
	 */
	exports.decodeMessage = function (message) {
	    try {
	        var params = JSON.parse(message.data);
	        if (typeof params.data === 'string') {
	            try {
	                params.data = JSON.parse(params.data);
	            }
	            catch (e) {
	                if (!(e instanceof SyntaxError)) {
	                    // TODO looks like unreachable code
	                    // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/JSON/parse
	                    throw e;
	                }
	            }
	        }
	        return params;
	    }
	    catch (e) {
	        throw { type: 'MessageParseError', error: e, data: message.data };
	    }
	};
	/**
	 * Encodes a message to be sent.
	 *
	 * @param  {Object} message
	 * @return {String}
	 */
	exports.encodeMessage = function (message) {
	    return JSON.stringify(message);
	};
	/** Processes a handshake message and returns appropriate actions.
	 *
	 * Returns an object with an 'action' and other action-specific properties.
	 *
	 * There are three outcomes when calling this function. First is a successful
	 * connection attempt, when pusher:connection_established is received, which
	 * results in a 'connected' action with an 'id' property. When passed a
	 * pusher:error event, it returns a result with action appropriate to the
	 * close code and an error. Otherwise, it raises an exception.
	 *
	 * @param {String} message
	 * @result Object
	 */
	exports.processHandshake = function (message) {
	    message = exports.decodeMessage(message);
	    if (message.event === internal_events_1.default.CONNECTION_ESTABLISHED) {
	        if (!message.data.activity_timeout) {
	            throw "No activity timeout specified in handshake";
	        }
	        return {
	            action: handshake_results_1.default.CONNECTED,
	            id: message.data.socket_id,
	            activityTimeout: message.data.activity_timeout * 1000
	        };
	    }
	    else if (message.event === internal_events_1.default.ERROR) {
	        // From protocol 6 close codes are sent only once, so this only
	        // happens when connection does not support close codes
	        return {
	            action: this.getCloseAction(message.data),
	            error: this.getCloseError(message.data)
	        };
	    }
	    else {
	        throw "Invalid handshake";
	    }
	};
	/**
	 * Dispatches the close event and returns an appropriate action name.
	 *
	 * See:
	 * 1. https://developer.mozilla.org/en-US/docs/WebSockets/WebSockets_reference/CloseEvent
	 * 2. http://pusher.com/docs/pusher_protocol
	 *
	 * @param  {CloseEvent} closeEvent
	 * @return {String} close action name
	 */
	exports.getCloseAction = function (closeEvent) {
	    if (closeEvent.code < 4000) {
	        // ignore 1000 CLOSE_NORMAL, 1001 CLOSE_GOING_AWAY,
	        //        1005 CLOSE_NO_STATUS, 1006 CLOSE_ABNORMAL
	        // ignore 1007...3999
	        // handle 1002 CLOSE_PROTOCOL_ERROR, 1003 CLOSE_UNSUPPORTED,
	        //        1004 CLOSE_TOO_LARGE
	        if (closeEvent.code >= 1002 && closeEvent.code <= 1004) {
	            return handshake_results_1.default.BACKOFF;
	        }
	        else {
	            return null;
	        }
	    }
	    else if (closeEvent.code === 4000) {
	        return handshake_results_1.default.SSL_ONLY;
	    }
	    else if (closeEvent.code < 4100) {
	        return handshake_results_1.default.REFUSED;
	    }
	    else if (closeEvent.code < 4200) {
	        return handshake_results_1.default.BACKOFF;
	    }
	    else if (closeEvent.code < 4300) {
	        return handshake_results_1.default.RETRY;
	    }
	    else {
	        // unknown error
	        return handshake_results_1.default.REFUSED;
	    }
	};
	/**
	 * Returns an error or null basing on the close event.
	 *
	 * Null is returned when connection was closed cleanly. Otherwise, an object
	 * with error details is returned.
	 *
	 * @param  {CloseEvent} closeEvent
	 * @return {Object} error object
	 */
	exports.getCloseError = function (closeEvent) {
	    if (closeEvent.code !== 1000 && closeEvent.code !== 1001) {
	        return {
	            type: 'PusherError',
	            data: {
	                code: closeEvent.code,
	                message: closeEvent.reason || closeEvent.message
	            }
	        };
	    }
	    else {
	        return null;
	    }
	};


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var http_request_1 = __webpack_require__(38);
	var http_socket_1 = __webpack_require__(39);
	var http_streaming_socket_1 = __webpack_require__(40);
	var http_polling_socket_1 = __webpack_require__(37);
	var http_xhr_request_1 = __webpack_require__(42);
	var http_xdomain_request_1 = __webpack_require__(41);
	var HTTP = {
	    createStreamingSocket: function (url) {
	        return this.createSocket(http_streaming_socket_1.default, url);
	    },
	    createPollingSocket: function (url) {
	        return this.createSocket(http_polling_socket_1.default, url);
	    },
	    createSocket: function (hooks, url) {
	        return new http_socket_1.default(hooks, url);
	    },
	    createXHR: function (method, url) {
	        return this.createRequest(http_xhr_request_1.default, method, url);
	    },
	    createXDR: function (method, url) {
	        return this.createRequest(http_xdomain_request_1.default, method, url);
	    },
	    createRequest: function (hooks, method, url) {
	        return new http_request_1.default(hooks, method, url);
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = HTTP;


/***/ },
/* 20 */
/***/ function(module, exports) {

	"use strict";
	var WS = {
	    getAPI: function () {
	        return WebSocket;
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = WS;


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Collections = __webpack_require__(0);
	var transports_1 = __webpack_require__(24);
	var auth_transports_1 = __webpack_require__(14);
	var timeline_transports_1 = __webpack_require__(23);
	var script_receiver_factory_1 = __webpack_require__(10);
	var dependencies_1 = __webpack_require__(9);
	var Runtime = (function () {
	    function Runtime() {
	        // for jsonp auth
	        this.nextAuthCallbackID = 1;
	        this.auth_callbacks = {};
	        this.ScriptReceivers = script_receiver_factory_1.ScriptReceivers;
	        this.DependenciesReceivers = dependencies_1.DependenciesReceivers;
	    }
	    Runtime.prototype.getLocalStorage = function () {
	        try {
	            return window.localStorage;
	        }
	        catch (e) {
	            return undefined;
	        }
	    };
	    Runtime.prototype.getClientFeatures = function () {
	        return Collections.keys(Collections.filterObject({ "ws": transports_1.default.WSTransport }, function (t) { return t.isSupported({}); }));
	    };
	    Runtime.prototype.getAuthorizers = function () {
	        return { ajaxAuth: auth_transports_1.ajax };
	    };
	    Runtime.prototype.getTimelineTransport = function (sender, encrypted) {
	        return timeline_transports_1.xhr(sender, encrypted);
	    };
	    return Runtime;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Runtime;


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Collections = __webpack_require__(0);
	var util_1 = __webpack_require__(1);
	var timers_1 = __webpack_require__(6);
	/** Loops through strategies with optional timeouts.
	 *
	 * Options:
	 * - loop - whether it should loop through the substrategy list
	 * - timeout - initial timeout for a single substrategy
	 * - timeoutLimit - maximum timeout
	 *
	 * @param {Strategy[]} strategies
	 * @param {Object} options
	 */
	var SequentialStrategy = (function () {
	    function SequentialStrategy(strategies, options) {
	        this.strategies = strategies;
	        this.loop = Boolean(options.loop);
	        this.failFast = Boolean(options.failFast);
	        this.timeout = options.timeout;
	        this.timeoutLimit = options.timeoutLimit;
	    }
	    SequentialStrategy.prototype.isSupported = function () {
	        return Collections.any(this.strategies, util_1.default.method("isSupported"));
	    };
	    SequentialStrategy.prototype.connect = function (minPriority, callback) {
	        var self = this;
	        var strategies = this.strategies;
	        var current = 0;
	        var timeout = this.timeout;
	        var runner = null;
	        var tryNextStrategy = function (error, handshake) {
	            if (handshake) {
	                callback(null, handshake);
	            }
	            else {
	                current = current + 1;
	                if (self.loop) {
	                    current = current % strategies.length;
	                }
	                if (current < strategies.length) {
	                    if (timeout) {
	                        timeout = timeout * 2;
	                        if (self.timeoutLimit) {
	                            timeout = Math.min(timeout, self.timeoutLimit);
	                        }
	                    }
	                    runner = self.tryStrategy(strategies[current], minPriority, { timeout: timeout, failFast: self.failFast }, tryNextStrategy);
	                }
	                else {
	                    callback(true);
	                }
	            }
	        };
	        runner = this.tryStrategy(strategies[current], minPriority, { timeout: timeout, failFast: this.failFast }, tryNextStrategy);
	        return {
	            abort: function () {
	                runner.abort();
	            },
	            forceMinPriority: function (p) {
	                minPriority = p;
	                if (runner) {
	                    runner.forceMinPriority(p);
	                }
	            }
	        };
	    };
	    /** @private */
	    SequentialStrategy.prototype.tryStrategy = function (strategy, minPriority, options, callback) {
	        var timer = null;
	        var runner = null;
	        if (options.timeout > 0) {
	            timer = new timers_1.OneOffTimer(options.timeout, function () {
	                runner.abort();
	                callback(true);
	            });
	        }
	        runner = strategy.connect(minPriority, function (error, handshake) {
	            if (error && timer && timer.isRunning() && !options.failFast) {
	                // advance to the next strategy after the timeout
	                return;
	            }
	            if (timer) {
	                timer.ensureAborted();
	            }
	            callback(error, handshake);
	        });
	        return {
	            abort: function () {
	                if (timer) {
	                    timer.ensureAborted();
	                }
	                runner.abort();
	            },
	            forceMinPriority: function (p) {
	                runner.forceMinPriority(p);
	            }
	        };
	    };
	    return SequentialStrategy;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = SequentialStrategy;


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var script_receiver_factory_1 = __webpack_require__(10);
	var logger_1 = __webpack_require__(4);
	var Collections = __webpack_require__(0);
	var util_1 = __webpack_require__(1);
	var factory_1 = __webpack_require__(2);
	var runtime_1 = __webpack_require__(5);
	var jsonp = function (sender, encrypted) {
	    return function (data, callback) {
	        var scheme = "http" + (encrypted ? "s" : "") + "://";
	        var url = scheme + (sender.host || sender.options.host) + sender.options.path + "/jsonp";
	        var request = factory_1.default.createJSONPRequest(url, data);
	        var receiver = runtime_1.default.ScriptReceivers.create(function (error, result) {
	            script_receiver_factory_1.ScriptReceivers.remove(receiver);
	            request.cleanup();
	            if (result && result.host) {
	                sender.host = result.host;
	            }
	            if (callback) {
	                callback(error, result);
	            }
	        });
	        request.send(receiver);
	    };
	};
	exports.jsonp = jsonp;
	var xhr = function (sender, encrypted) {
	    return function (data, callback) {
	        var scheme = "http" + (encrypted ? "s" : "") + "://";
	        var url = scheme + (sender.options.host) + sender.options.path + "/xhr";
	        var params = Collections.filterObject(data, function (value) {
	            return value !== undefined;
	        });
	        var query = Collections.map(Collections.flatten(Collections.encodeParamsObject(params)), util_1.default.method("join", "=")).join("&");
	        url += ("/" + 2 + "?" + query);
	        var xhr = factory_1.default.createXHR();
	        xhr.open("GET", url, true);
	        xhr.onreadystatechange = function () {
	            if (xhr.readyState === 4) {
	                if (xhr.status !== 200) {
	                    logger_1.default.debug("TimelineSender Error: received " + xhr.status + " from stats.pusher.com");
	                }
	            }
	        };
	        xhr.send();
	    };
	};
	exports.xhr = xhr;


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var URLSchemes = __webpack_require__(65);
	var transport_ts_1 = __webpack_require__(62);
	var Collections = __webpack_require__(0);
	var ws_1 = __webpack_require__(20);
	var http_1 = __webpack_require__(19);
	var factory_1 = __webpack_require__(2);
	var runtime_1 = __webpack_require__(5);
	var dependencies_1 = __webpack_require__(9);
	/** WebSocket transport.
	 *
	 * Uses native WebSocket implementation, including MozWebSocket supported by
	 * earlier Firefox versions.
	 */
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
	/** HTTP streaming transport using CORS-enabled XMLHttpRequest. */
	var XHRStreamingTransport = new transport_ts_1.default(Collections.extend({}, streamingConfiguration, xhrConfiguration));
	/** HTTP streaming transport using XDomainRequest (IE 8,9). */
	var XDRStreamingTransport = new transport_ts_1.default(Collections.extend({}, streamingConfiguration, xdrConfiguration));
	/** HTTP long-polling transport using CORS-enabled XMLHttpRequest. */
	var XHRPollingTransport = new transport_ts_1.default(Collections.extend({}, pollingConfiguration, xhrConfiguration));
	/** HTTP long-polling transport using XDomainRequest (IE 8,9). */
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


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var defaults_1 = __webpack_require__(7);
	exports.getGlobalConfig = function () {
	    return {
	        wsHost: defaults_1.default.host,
	        wsPort: defaults_1.default.ws_port,
	        wssPort: defaults_1.default.wss_port,
	        httpHost: defaults_1.default.sockjs_host,
	        httpPort: defaults_1.default.sockjs_http_port,
	        httpsPort: defaults_1.default.sockjs_https_port,
	        httpPath: defaults_1.default.sockjs_path,
	        statsHost: defaults_1.default.stats_host,
	        authEndpoint: defaults_1.default.channel_auth_endpoint,
	        authTransport: defaults_1.default.channel_auth_transport,
	        // TODO make this consistent with other options in next major version
	        activity_timeout: defaults_1.default.activity_timeout,
	        pong_timeout: defaults_1.default.pong_timeout,
	        unavailable_timeout: defaults_1.default.unavailable_timeout
	    };
	};
	exports.getClusterConfig = function (clusterName) {
	    return {
	        wsHost: "ws-" + clusterName + ".pusher.com",
	        httpHost: "sockjs-" + clusterName + ".pusher.com"
	    };
	};


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Collections = __webpack_require__(0);
	var util_1 = __webpack_require__(1);
	var transports_1 = __webpack_require__(24);
	var transport_manager_1 = __webpack_require__(64);
	var Errors = __webpack_require__(8);
	var transport_strategy_1 = __webpack_require__(59);
	var sequential_strategy_1 = __webpack_require__(22);
	var best_connected_ever_strategy_1 = __webpack_require__(54);
	var cached_strategy_1 = __webpack_require__(55);
	var delayed_strategy_1 = __webpack_require__(56);
	var if_strategy_1 = __webpack_require__(58);
	var first_connected_strategy_1 = __webpack_require__(57);
	/** Transforms a JSON scheme to a strategy tree.
	 *
	 * @param {Array} scheme JSON strategy scheme
	 * @param {Object} options a hash of symbols to be included in the scheme
	 * @returns {Strategy} strategy tree that's represented by the scheme
	 */
	exports.build = function (scheme, options) {
	    var context = Collections.extend({}, globalContext, options);
	    return evaluate(scheme, context)[1].strategy;
	};
	var transports = {
	    ws: transports_1.default.WSTransport,
	    sockjs: transports_1.default.SockJSTransport,
	    xhr_streaming: transports_1.default.XHRStreamingTransport,
	    xdr_streaming: transports_1.default.XDRStreamingTransport,
	    xhr_polling: transports_1.default.XHRPollingTransport,
	    xdr_polling: transports_1.default.XDRPollingTransport
	};
	var UnsupportedStrategy = {
	    isSupported: function () {
	        return false;
	    },
	    connect: function (_, callback) {
	        var deferred = util_1.default.defer(function () {
	            callback(new Errors.UnsupportedStrategy());
	        });
	        return {
	            abort: function () {
	                deferred.ensureAborted();
	            },
	            forceMinPriority: function () { }
	        };
	    }
	};
	// DSL bindings
	function returnWithOriginalContext(f) {
	    return function (context) {
	        return [f.apply(this, arguments), context];
	    };
	}
	var globalContext = {
	    extend: function (context, first, second) {
	        return [Collections.extend({}, first, second), context];
	    },
	    def: function (context, name, value) {
	        if (context[name] !== undefined) {
	            throw "Redefining symbol " + name;
	        }
	        context[name] = value;
	        return [undefined, context];
	    },
	    def_transport: function (context, name, type, priority, options, manager) {
	        var transportClass = transports[type];
	        if (!transportClass) {
	            throw new Errors.UnsupportedTransport(type);
	        }
	        var enabled = (!context.enabledTransports ||
	            Collections.arrayIndexOf(context.enabledTransports, name) !== -1) &&
	            (!context.disabledTransports ||
	                Collections.arrayIndexOf(context.disabledTransports, name) === -1);
	        var transport;
	        if (enabled) {
	            transport = new transport_strategy_1.default(name, priority, manager ? manager.getAssistant(transportClass) : transportClass, Collections.extend({
	                key: context.key,
	                encrypted: context.encrypted,
	                timeline: context.timeline,
	                ignoreNullOrigin: context.ignoreNullOrigin
	            }, options));
	        }
	        else {
	            transport = UnsupportedStrategy;
	        }
	        var newContext = context.def(context, name, transport)[1];
	        newContext.transports = context.transports || {};
	        newContext.transports[name] = transport;
	        return [undefined, newContext];
	    },
	    transport_manager: returnWithOriginalContext(function (_, options) {
	        return new transport_manager_1.default(options);
	    }),
	    sequential: returnWithOriginalContext(function (_, options) {
	        var strategies = Array.prototype.slice.call(arguments, 2);
	        return new sequential_strategy_1.default(strategies, options);
	    }),
	    cached: returnWithOriginalContext(function (context, ttl, strategy) {
	        return new cached_strategy_1.default(strategy, context.transports, {
	            ttl: ttl,
	            timeline: context.timeline,
	            encrypted: context.encrypted
	        });
	    }),
	    first_connected: returnWithOriginalContext(function (_, strategy) {
	        return new first_connected_strategy_1.default(strategy);
	    }),
	    best_connected_ever: returnWithOriginalContext(function () {
	        var strategies = Array.prototype.slice.call(arguments, 1);
	        return new best_connected_ever_strategy_1.default(strategies);
	    }),
	    delayed: returnWithOriginalContext(function (_, delay, strategy) {
	        return new delayed_strategy_1.default(strategy, { delay: delay });
	    }),
	    "if": returnWithOriginalContext(function (_, test, trueBranch, falseBranch) {
	        return new if_strategy_1.default(test, trueBranch, falseBranch);
	    }),
	    is_supported: returnWithOriginalContext(function (_, strategy) {
	        return function () {
	            return strategy.isSupported();
	        };
	    })
	};
	// DSL interpreter
	function isSymbol(expression) {
	    return (typeof expression === "string") && expression.charAt(0) === ":";
	}
	function getSymbolValue(expression, context) {
	    return context[expression.slice(1)];
	}
	function evaluateListOfExpressions(expressions, context) {
	    if (expressions.length === 0) {
	        return [[], context];
	    }
	    var head = evaluate(expressions[0], context);
	    var tail = evaluateListOfExpressions(expressions.slice(1), head[1]);
	    return [[head[0]].concat(tail[0]), tail[1]];
	}
	function evaluateString(expression, context) {
	    if (!isSymbol(expression)) {
	        return [expression, context];
	    }
	    var value = getSymbolValue(expression, context);
	    if (value === undefined) {
	        throw "Undefined symbol " + expression;
	    }
	    return [value, context];
	}
	function evaluateArray(expression, context) {
	    if (isSymbol(expression[0])) {
	        var f = getSymbolValue(expression[0], context);
	        if (expression.length > 1) {
	            if (typeof f !== "function") {
	                throw "Calling non-function " + expression[0];
	            }
	            var args = [Collections.extend({}, context)].concat(Collections.map(expression.slice(1), function (arg) {
	                return evaluate(arg, Collections.extend({}, context))[0];
	            }));
	            return f.apply(this, args);
	        }
	        else {
	            return [f, context];
	        }
	    }
	    else {
	        return evaluateListOfExpressions(expression, context);
	    }
	}
	function evaluate(expression, context) {
	    if (typeof expression === "string") {
	        return evaluateString(expression, context);
	    }
	    else if (typeof expression === "object") {
	        if (expression instanceof Array && expression.length > 0) {
	            return evaluateArray(expression, context);
	        }
	    }
	    return [expression, context];
	}


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Collections = __webpack_require__(0);
	var util_1 = __webpack_require__(1);
	var level_1 = __webpack_require__(13);
	var Timeline = (function () {
	    function Timeline(key, session, options) {
	        this.key = key;
	        this.session = session;
	        this.events = [];
	        this.options = options || {};
	        this.sent = 0;
	        this.uniqueID = 0;
	    }
	    Timeline.prototype.log = function (level, event) {
	        if (level <= this.options.level) {
	            this.events.push(Collections.extend({}, event, { timestamp: util_1.default.now() }));
	            if (this.options.limit && this.events.length > this.options.limit) {
	                this.events.shift();
	            }
	        }
	    };
	    Timeline.prototype.error = function (event) {
	        this.log(level_1.default.ERROR, event);
	    };
	    Timeline.prototype.info = function (event) {
	        this.log(level_1.default.INFO, event);
	    };
	    Timeline.prototype.debug = function (event) {
	        this.log(level_1.default.DEBUG, event);
	    };
	    Timeline.prototype.isEmpty = function () {
	        return this.events.length === 0;
	    };
	    Timeline.prototype.send = function (sendfn, callback) {
	        var self = this;
	        var data = Collections.extend({
	            session: self.session,
	            bundle: self.sent + 1,
	            key: self.key,
	            lib: "js",
	            version: self.options.version,
	            cluster: self.options.cluster,
	            features: self.options.features,
	            timeline: self.events
	        }, self.options.params);
	        self.events = [];
	        sendfn(data, function (error, result) {
	            if (!error) {
	                self.sent++;
	            }
	            if (callback) {
	                callback(error, result);
	            }
	        });
	        return true;
	    };
	    Timeline.prototype.generateUniqueID = function () {
	        this.uniqueID++;
	        return this.uniqueID;
	    };
	    return Timeline;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Timeline;


/***/ },
/* 28 */
/***/ function(module, exports) {

	"use strict";
	var global = Function("return this")();
	function encode(s) {
	    return btoa(utob(s));
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = encode;
	var fromCharCode = String.fromCharCode;
	var b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	var b64tab = {};
	for (var i = 0, l = b64chars.length; i < l; i++) {
	    b64tab[b64chars.charAt(i)] = i;
	}
	var cb_utob = function (c) {
	    var cc = c.charCodeAt(0);
	    return cc < 0x80 ? c
	        : cc < 0x800 ? fromCharCode(0xc0 | (cc >>> 6)) +
	            fromCharCode(0x80 | (cc & 0x3f))
	            : fromCharCode(0xe0 | ((cc >>> 12) & 0x0f)) +
	                fromCharCode(0x80 | ((cc >>> 6) & 0x3f)) +
	                fromCharCode(0x80 | (cc & 0x3f));
	};
	var utob = function (u) {
	    return u.replace(/[^\x00-\x7F]/g, cb_utob);
	};
	var cb_encode = function (ccc) {
	    var padlen = [0, 2, 1][ccc.length % 3];
	    var ord = ccc.charCodeAt(0) << 16
	        | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
	        | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0));
	    var chars = [
	        b64chars.charAt(ord >>> 18),
	        b64chars.charAt((ord >>> 12) & 63),
	        padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
	        padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
	    ];
	    return chars.join('');
	};
	var btoa;
	if (global && global.btoa) {
	    btoa = global.btoa;
	}
	else {
	    btoa = function (b) {
	        return b.replace(/[\s\S]{1,3}/g, cb_encode);
	    };
	}


/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Collections = __webpack_require__(0);
	var factory_1 = __webpack_require__(2);
	/** Handles a channel map. */
	var Channels = (function () {
	    function Channels() {
	        this.channels = {};
	    }
	    /** Creates or retrieves an existing channel by its name.
	     *
	     * @param {String} name
	     * @param {Pusher} pusher
	     * @return {Channel}
	     */
	    Channels.prototype.add = function (name, pusher) {
	        if (!this.channels[name]) {
	            this.channels[name] = createChannel(name, pusher);
	        }
	        return this.channels[name];
	    };
	    /** Returns a list of all channels
	     *
	     * @return {Array}
	     */
	    Channels.prototype.all = function () {
	        return Collections.values(this.channels);
	    };
	    /** Finds a channel by its name.
	     *
	     * @param {String} name
	     * @return {Channel} channel or null if it doesn't exist
	     */
	    Channels.prototype.find = function (name) {
	        return this.channels[name];
	    };
	    /** Removes a channel from the map.
	     *
	     * @param {String} name
	     */
	    Channels.prototype.remove = function (name) {
	        var channel = this.channels[name];
	        delete this.channels[name];
	        return channel;
	    };
	    /** Proxies disconnection signal to all channels. */
	    Channels.prototype.disconnect = function () {
	        Collections.objectApply(this.channels, function (channel) {
	            channel.disconnect();
	        });
	    };
	    return Channels;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Channels;
	function createChannel(name, pusher) {
	    if (name.indexOf('private-') === 0) {
	        return factory_1.default.createPrivateChannel(name, pusher);
	    }
	    else if (name.indexOf('presence-') === 0) {
	        return factory_1.default.createPresenceChannel(name, pusher);
	    }
	    else {
	        return factory_1.default.createChannel(name, pusher);
	    }
	}


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Collections = __webpack_require__(0);
	/** Represents a collection of members of a presence channel. */
	var Members = (function () {
	    function Members() {
	        this.reset();
	    }
	    /** Returns member's info for given id.
	     *
	     * Resulting object containts two fields - id and info.
	     *
	     * @param {Number} id
	     * @return {Object} member's info or null
	     */
	    Members.prototype.get = function (id) {
	        if (Object.prototype.hasOwnProperty.call(this.members, id)) {
	            return {
	                id: id,
	                info: this.members[id]
	            };
	        }
	        else {
	            return null;
	        }
	    };
	    /** Calls back for each member in unspecified order.
	     *
	     * @param  {Function} callback
	     */
	    Members.prototype.each = function (callback) {
	        var _this = this;
	        Collections.objectApply(this.members, function (member, id) {
	            callback(_this.get(id));
	        });
	    };
	    /** Updates the id for connected member. For internal use only. */
	    Members.prototype.setMyID = function (id) {
	        this.myID = id;
	    };
	    /** Handles subscription data. For internal use only. */
	    Members.prototype.onSubscription = function (subscriptionData) {
	        this.members = subscriptionData.presence.hash;
	        this.count = subscriptionData.presence.count;
	        this.me = this.get(this.myID);
	    };
	    /** Adds a new member to the collection. For internal use only. */
	    Members.prototype.addMember = function (memberData) {
	        if (this.get(memberData.user_id) === null) {
	            this.count++;
	        }
	        this.members[memberData.user_id] = memberData.user_info;
	        return this.get(memberData.user_id);
	    };
	    /** Adds a member from the collection. For internal use only. */
	    Members.prototype.removeMember = function (memberData) {
	        var member = this.get(memberData.user_id);
	        if (member) {
	            delete this.members[memberData.user_id];
	            this.count--;
	        }
	        return member;
	    };
	    /** Resets the collection to the initial state. For internal use only. */
	    Members.prototype.reset = function () {
	        this.members = {};
	        this.count = 0;
	        this.myID = null;
	        this.me = null;
	    };
	    return Members;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Members;


/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var private_channel_1 = __webpack_require__(16);
	var logger_1 = __webpack_require__(4);
	var members_1 = __webpack_require__(30);
	var PresenceChannel = (function (_super) {
	    __extends(PresenceChannel, _super);
	    /** Adds presence channel functionality to private channels.
	     *
	     * @param {String} name
	     * @param {Pusher} pusher
	     */
	    function PresenceChannel(name, pusher) {
	        _super.call(this, name, pusher);
	        this.members = new members_1.default();
	    }
	    /** Authenticates the connection as a member of the channel.
	     *
	     * @param  {String} socketId
	     * @param  {Function} callback
	     */
	    PresenceChannel.prototype.authorize = function (socketId, callback) {
	        var self = this;
	        _super.prototype.authorize.call(this, socketId, function (error, authData) {
	            if (!error) {
	                if (authData.channel_data === undefined) {
	                    logger_1.default.warn("Invalid auth response for channel '" +
	                        self.name +
	                        "', expected 'channel_data' field");
	                    callback("Invalid auth response");
	                    return;
	                }
	                var channelData = JSON.parse(authData.channel_data);
	                self.members.setMyID(channelData.user_id);
	            }
	            callback(error, authData);
	        });
	    };
	    /** Handles presence and subscription events. For internal use only.
	     *
	     * @param {String} event
	     * @param {*} data
	     */
	    PresenceChannel.prototype.handleEvent = function (event, data) {
	        switch (event) {
	            case "pusher_internal:subscription_succeeded":
	                this.members.onSubscription(data);
	                this.subscribed = true;
	                this.emit("pusher:subscription_succeeded", this.members);
	                break;
	            case "pusher_internal:member_added":
	                var addedMember = this.members.addMember(data);
	                this.emit('pusher:member_added', addedMember);
	                break;
	            case "pusher_internal:member_removed":
	                var removedMember = this.members.removeMember(data);
	                if (removedMember) {
	                    this.emit('pusher:member_removed', removedMember);
	                }
	                break;
	            default:
	                private_channel_1.default.prototype.handleEvent.call(this, event, data);
	        }
	    };
	    /** Resets the channel state, including members map. For internal use only. */
	    PresenceChannel.prototype.disconnect = function () {
	        this.members.reset();
	        _super.prototype.disconnect.call(this);
	    };
	    return PresenceChannel;
	}(private_channel_1.default));
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = PresenceChannel;


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var Collections = __webpack_require__(0);
	var dispatcher_1 = __webpack_require__(3);
	var Protocol = __webpack_require__(18);
	var logger_1 = __webpack_require__(4);
	/**
	 * Provides Pusher protocol interface for transports.
	 *
	 * Emits following events:
	 * - message - on received messages
	 * - ping - on ping requests
	 * - pong - on pong responses
	 * - error - when the transport emits an error
	 * - closed - after closing the transport
	 *
	 * It also emits more events when connection closes with a code.
	 * See Protocol.getCloseAction to get more details.
	 *
	 * @param {Number} id
	 * @param {AbstractTransport} transport
	 */
	var Connection = (function (_super) {
	    __extends(Connection, _super);
	    function Connection(id, transport) {
	        _super.call(this);
	        this.id = id;
	        this.transport = transport;
	        this.activityTimeout = transport.activityTimeout;
	        this.bindListeners();
	    }
	    /** Returns whether used transport handles activity checks by itself
	     *
	     * @returns {Boolean} true if activity checks are handled by the transport
	     */
	    Connection.prototype.handlesActivityChecks = function () {
	        return this.transport.handlesActivityChecks();
	    };
	    /** Sends raw data.
	     *
	     * @param {String} data
	     */
	    Connection.prototype.send = function (data) {
	        return this.transport.send(data);
	    };
	    /** Sends an event.
	     *
	     * @param {String} name
	     * @param {String} data
	     * @param {String} [channel]
	     * @returns {Boolean} whether message was sent or not
	     */
	    Connection.prototype.send_event = function (name, data, channel) {
	        var message = { event: name, data: data };
	        if (channel) {
	            message.channel = channel;
	        }
	        logger_1.default.debug('Event sent', message);
	        return this.send(Protocol.encodeMessage(message));
	    };
	    /** Sends a ping message to the server.
	     *
	     * Basing on the underlying transport, it might send either transport's
	     * protocol-specific ping or pusher:ping event.
	     */
	    Connection.prototype.ping = function () {
	        if (this.transport.supportsPing()) {
	            this.transport.ping();
	        }
	        else {
	            this.send_event('pusher:ping', {});
	        }
	    };
	    /** Closes the connection. */
	    Connection.prototype.close = function () {
	        this.transport.close();
	    };
	    /** @private */
	    Connection.prototype.bindListeners = function () {
	        var self = this;
	        var listeners = {
	            message: function (m) {
	                var message;
	                try {
	                    message = Protocol.decodeMessage(m);
	                }
	                catch (e) {
	                    self.emit('error', {
	                        type: 'MessageParseError',
	                        error: e,
	                        data: m.data
	                    });
	                }
	                if (message !== undefined) {
	                    logger_1.default.debug('Event recd', message);
	                    switch (message.event) {
	                        case 'pusher:error':
	                            self.emit('error', { type: 'PusherError', data: message.data });
	                            break;
	                        case 'pusher:ping':
	                            self.emit("ping");
	                            break;
	                        case 'pusher:pong':
	                            self.emit("pong");
	                            break;
	                    }
	                    self.emit('message', message);
	                }
	            },
	            activity: function () {
	                self.emit("activity");
	            },
	            error: function (error) {
	                self.emit("error", { type: "WebSocketError", error: error });
	            },
	            closed: function (closeEvent) {
	                unbindListeners();
	                if (closeEvent && closeEvent.code) {
	                    self.handleCloseEvent(closeEvent);
	                }
	                self.transport = null;
	                self.emit("closed");
	            }
	        };
	        var unbindListeners = function () {
	            Collections.objectApply(listeners, function (listener, event) {
	                self.transport.unbind(event, listener);
	            });
	        };
	        Collections.objectApply(listeners, function (listener, event) {
	            self.transport.bind(event, listener);
	        });
	    };
	    /** @private */
	    Connection.prototype.handleCloseEvent = function (closeEvent) {
	        var action = Protocol.getCloseAction(closeEvent);
	        var error = Protocol.getCloseError(closeEvent);
	        if (error) {
	            this.emit('error', error);
	        }
	        if (action) {
	            this.emit(action);
	        }
	    };
	    return Connection;
	}(dispatcher_1.default));
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Connection;


/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var dispatcher_1 = __webpack_require__(3);
	var timers_1 = __webpack_require__(6);
	var net_info_1 = __webpack_require__(45);
	var logger_1 = __webpack_require__(4);
	var state_1 = __webpack_require__(11);
	var Collections = __webpack_require__(0);
	/** Manages connection to Pusher.
	 *
	 * Uses a strategy (currently only default), timers and network availability
	 * info to establish a connection and export its state. In case of failures,
	 * manages reconnection attempts.
	 *
	 * Exports state changes as following events:
	 * - "state_change", { previous: p, current: state }
	 * - state
	 *
	 * States:
	 * - initialized - initial state, never transitioned to
	 * - connecting - connection is being established
	 * - connected - connection has been fully established
	 * - disconnected - on requested disconnection
	 * - unavailable - after connection timeout or when there's no network
	 * - failed - when the connection strategy is not supported
	 *
	 * Options:
	 * - unavailableTimeout - time to transition to unavailable state
	 * - activityTimeout - time after which ping message should be sent
	 * - pongTimeout - time for Pusher to respond with pong before reconnecting
	 *
	 * @param {String} key application key
	 * @param {Object} options
	 */
	var ConnectionManager = (function (_super) {
	    __extends(ConnectionManager, _super);
	    function ConnectionManager(key, options) {
	        _super.call(this);
	        this.key = key;
	        this.options = options || {};
	        this.state = state_1.default.INITIALIZED;
	        this.connection = null;
	        this.encrypted = !!options.encrypted;
	        this.timeline = this.options.timeline;
	        this.connectionCallbacks = this.buildConnectionCallbacks();
	        this.errorCallbacks = this.buildErrorCallbacks();
	        this.handshakeCallbacks = this.buildHandshakeCallbacks(this.errorCallbacks);
	        var self = this;
	        net_info_1.Network.bind("online", function () {
	            self.timeline.info({ netinfo: "online" });
	            if ((self.state) === "connecting" || (self.state) === "unavailable") {
	                self.retryIn(0);
	            }
	        });
	        net_info_1.Network.bind("offline", function () {
	            self.timeline.info({ netinfo: "offline" });
	            if (self.connection) {
	                self.sendActivityCheck();
	            }
	        });
	        this.updateStrategy();
	    }
	    /** Establishes a connection to Pusher.
	     *
	     * Does nothing when connection is already established. See top-level doc
	     * to find events emitted on connection attempts.
	     */
	    ConnectionManager.prototype.connect = function () {
	        if (this.connection || this.runner) {
	            return;
	        }
	        if (!this.strategy.isSupported()) {
	            this.updateState(state_1.default.FAILED);
	            return;
	        }
	        this.updateState(state_1.default.CONNECTING);
	        this.startConnecting();
	        this.setUnavailableTimer();
	    };
	    ;
	    /** Sends raw data.
	     *
	     * @param {String} data
	     */
	    ConnectionManager.prototype.send = function (data) {
	        if (this.connection) {
	            return this.connection.send(data);
	        }
	        else {
	            return false;
	        }
	    };
	    ;
	    /** Sends an event.
	     *
	     * @param {String} name
	     * @param {String} data
	     * @param {String} [channel]
	     * @returns {Boolean} whether message was sent or not
	     */
	    ConnectionManager.prototype.send_event = function (name, data, channel) {
	        if (this.connection) {
	            return this.connection.send_event(name, data, channel);
	        }
	        else {
	            return false;
	        }
	    };
	    ;
	    /** Closes the connection. */
	    ConnectionManager.prototype.disconnect = function () {
	        this.disconnectInternally();
	        this.updateState(state_1.default.DISCONNECTED);
	    };
	    ;
	    ConnectionManager.prototype.isEncrypted = function () {
	        return this.encrypted;
	    };
	    ;
	    /** @private */
	    ConnectionManager.prototype.startConnecting = function () {
	        var self = this;
	        var callback = function (error, handshake) {
	            if (error) {
	                self.runner = self.strategy.connect(0, callback);
	            }
	            else {
	                if (handshake.action === "error") {
	                    self.emit("error", { type: "HandshakeError", error: handshake.error });
	                    self.timeline.error({ handshakeError: handshake.error });
	                }
	                else {
	                    self.abortConnecting(); // we don't support switching connections yet
	                    self.handshakeCallbacks[handshake.action](handshake);
	                }
	            }
	        };
	        self.runner = self.strategy.connect(0, callback);
	    };
	    ;
	    /** @private */
	    ConnectionManager.prototype.abortConnecting = function () {
	        if (this.runner) {
	            this.runner.abort();
	            this.runner = null;
	        }
	    };
	    ;
	    /** @private */
	    ConnectionManager.prototype.disconnectInternally = function () {
	        this.abortConnecting();
	        this.clearRetryTimer();
	        this.clearUnavailableTimer();
	        if (this.connection) {
	            var connection = this.abandonConnection();
	            connection.close();
	        }
	    };
	    ;
	    /** @private */
	    ConnectionManager.prototype.updateStrategy = function () {
	        this.strategy = this.options.getStrategy({
	            key: this.key,
	            timeline: this.timeline,
	            encrypted: this.encrypted
	        });
	    };
	    ;
	    /** @private */
	    ConnectionManager.prototype.retryIn = function (delay) {
	        var self = this;
	        self.timeline.info({ action: "retry", delay: delay });
	        if (delay > 0) {
	            self.emit("connecting_in", Math.round(delay / 1000));
	        }
	        self.retryTimer = new timers_1.OneOffTimer(delay || 0, function () {
	            self.disconnectInternally();
	            self.connect();
	        });
	    };
	    ;
	    /** @private */
	    ConnectionManager.prototype.clearRetryTimer = function () {
	        if (this.retryTimer) {
	            this.retryTimer.ensureAborted();
	            this.retryTimer = null;
	        }
	    };
	    ;
	    /** @private */
	    ConnectionManager.prototype.setUnavailableTimer = function () {
	        var self = this;
	        self.unavailableTimer = new timers_1.OneOffTimer(self.options.unavailableTimeout, function () {
	            self.updateState(state_1.default.UNAVAILABLE);
	        });
	    };
	    ;
	    /** @private */
	    ConnectionManager.prototype.clearUnavailableTimer = function () {
	        if (this.unavailableTimer) {
	            this.unavailableTimer.ensureAborted();
	        }
	    };
	    ;
	    /** @private */
	    ConnectionManager.prototype.sendActivityCheck = function () {
	        var self = this;
	        self.stopActivityCheck();
	        self.connection.ping();
	        // wait for pong response
	        self.activityTimer = new timers_1.OneOffTimer(self.options.pongTimeout, function () {
	            self.timeline.error({ pong_timed_out: self.options.pongTimeout });
	            self.retryIn(0);
	        });
	    };
	    ;
	    /** @private */
	    ConnectionManager.prototype.resetActivityCheck = function () {
	        var self = this;
	        self.stopActivityCheck();
	        // send ping after inactivity
	        if (!self.connection.handlesActivityChecks()) {
	            self.activityTimer = new timers_1.OneOffTimer(self.activityTimeout, function () {
	                self.sendActivityCheck();
	            });
	        }
	    };
	    ;
	    /** @private */
	    ConnectionManager.prototype.stopActivityCheck = function () {
	        if (this.activityTimer) {
	            this.activityTimer.ensureAborted();
	        }
	    };
	    ;
	    /** @private */
	    ConnectionManager.prototype.buildConnectionCallbacks = function () {
	        var self = this;
	        return {
	            message: function (message) {
	                // includes pong messages from server
	                self.resetActivityCheck();
	                self.emit('message', message);
	            },
	            ping: function () {
	                self.send_event('pusher:pong', {});
	            },
	            activity: function () {
	                self.resetActivityCheck();
	            },
	            error: function (error) {
	                // just emit error to user - socket will already be closed by browser
	                self.emit("error", { type: "WebSocketError", error: error });
	            },
	            closed: function () {
	                self.abandonConnection();
	                if (self.shouldRetry()) {
	                    self.retryIn(1000);
	                }
	            }
	        };
	    };
	    ;
	    /** @private */
	    ConnectionManager.prototype.buildHandshakeCallbacks = function (errorCallbacks) {
	        var self = this;
	        return Collections.extend({}, errorCallbacks, {
	            connected: function (handshake) {
	                self.activityTimeout = Math.min(self.options.activityTimeout, handshake.activityTimeout, handshake.connection.activityTimeout || Infinity);
	                self.clearUnavailableTimer();
	                self.setConnection(handshake.connection);
	                self.socket_id = self.connection.id;
	                self.updateState(state_1.default.CONNECTED, { socket_id: self.socket_id });
	            }
	        });
	    };
	    ;
	    /** @private */
	    ConnectionManager.prototype.buildErrorCallbacks = function () {
	        var self = this;
	        function withErrorEmitted(callback) {
	            return function (result) {
	                if (result.error) {
	                    self.emit("error", { type: "WebSocketError", error: result.error });
	                }
	                callback(result);
	            };
	        }
	        return {
	            ssl_only: withErrorEmitted(function () {
	                self.encrypted = true;
	                self.updateStrategy();
	                self.retryIn(0);
	            }),
	            refused: withErrorEmitted(function () {
	                self.disconnect();
	            }),
	            backoff: withErrorEmitted(function () {
	                self.retryIn(1000);
	            }),
	            retry: withErrorEmitted(function () {
	                self.retryIn(0);
	            })
	        };
	    };
	    ;
	    /** @private */
	    ConnectionManager.prototype.setConnection = function (connection) {
	        this.connection = connection;
	        for (var event in this.connectionCallbacks) {
	            this.connection.bind(event, this.connectionCallbacks[event]);
	        }
	        this.resetActivityCheck();
	    };
	    ;
	    /** @private */
	    ConnectionManager.prototype.abandonConnection = function () {
	        if (!this.connection) {
	            return;
	        }
	        this.stopActivityCheck();
	        for (var event in this.connectionCallbacks) {
	            this.connection.unbind(event, this.connectionCallbacks[event]);
	        }
	        var connection = this.connection;
	        this.connection = null;
	        return connection;
	    };
	    /** @private */
	    ConnectionManager.prototype.updateState = function (newState, data) {
	        var previousState = this.state;
	        this.state = newState;
	        if (previousState !== newState) {
	            var newStateDescription = newState;
	            if (newStateDescription === "connected") {
	                newStateDescription += " with new socket ID " + data.socket_id;
	            }
	            logger_1.default.debug('State changed', previousState + ' -> ' + newStateDescription);
	            this.timeline.info({ state: newState, params: data });
	            this.emit('state_change', { previous: previousState, current: newState });
	            this.emit(newState, data);
	        }
	    };
	    /** @private */
	    ConnectionManager.prototype.shouldRetry = function () {
	        return (this.state) === "connecting" || (this.state) === "connected";
	    };
	    return ConnectionManager;
	}(dispatcher_1.default));
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = ConnectionManager;


/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Collections = __webpack_require__(0);
	var Protocol = __webpack_require__(18);
	var connection_1 = __webpack_require__(32);
	var handshake_results_1 = __webpack_require__(17);
	/**
	 * Handles Pusher protocol handshakes for transports.
	 *
	 * Calls back with a result object after handshake is completed. Results
	 * always have two fields:
	 * - action - string describing action to be taken after the handshake
	 * - transport - the transport object passed to the constructor
	 *
	 * Different actions can set different additional properties on the result.
	 * In the case of 'connected' action, there will be a 'connection' property
	 * containing a Connection object for the transport. Other actions should
	 * carry an 'error' property.
	 *
	 * @param {AbstractTransport} transport
	 * @param {Function} callback
	 */
	var Handshake = (function () {
	    function Handshake(transport, callback) {
	        this.transport = transport;
	        this.callback = callback;
	        this.bindListeners();
	    }
	    Handshake.prototype.close = function () {
	        this.unbindListeners();
	        this.transport.close();
	    };
	    /** @private */
	    Handshake.prototype.bindListeners = function () {
	        var self = this;
	        self.onMessage = function (m) {
	            self.unbindListeners();
	            try {
	                var result = Protocol.processHandshake(m);
	                if (result.action === handshake_results_1.default.CONNECTED) {
	                    self.finish("connected", {
	                        connection: new connection_1.default(result.id, self.transport),
	                        activityTimeout: result.activityTimeout
	                    });
	                }
	                else {
	                    self.finish(result.action, { error: result.error });
	                    self.transport.close();
	                }
	            }
	            catch (e) {
	                self.finish("error", { error: e });
	                self.transport.close();
	            }
	        };
	        self.onClosed = function (closeEvent) {
	            self.unbindListeners();
	            var action = Protocol.getCloseAction(closeEvent) || "backoff";
	            var error = Protocol.getCloseError(closeEvent);
	            self.finish(action, { error: error });
	        };
	        self.transport.bind("message", self.onMessage);
	        self.transport.bind("closed", self.onClosed);
	    };
	    /** @private */
	    Handshake.prototype.unbindListeners = function () {
	        this.transport.unbind("message", this.onMessage);
	        this.transport.unbind("closed", this.onClosed);
	    };
	    /** @private */
	    Handshake.prototype.finish = function (action, params) {
	        this.callback(Collections.extend({ transport: this.transport, action: action }, params));
	    };
	    return Handshake;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Handshake;


/***/ },
/* 35 */
/***/ function(module, exports) {

	"use strict";
	var InternalEvents;
	(function (InternalEvents) {
	    InternalEvents[InternalEvents["CONNECTION_ESTABLISHED"] = "pusher:connection_established"] = "CONNECTION_ESTABLISHED";
	    InternalEvents[InternalEvents["ERROR"] = "pusher:error"] = "ERROR";
	})(InternalEvents || (InternalEvents = {}));
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = InternalEvents;


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Collections = __webpack_require__(0);
	var CallbackRegistry = (function () {
	    function CallbackRegistry() {
	        this._callbacks = {};
	    }
	    CallbackRegistry.prototype.get = function (name) {
	        return this._callbacks[prefix(name)];
	    };
	    CallbackRegistry.prototype.add = function (name, callback, context) {
	        var prefixedEventName = prefix(name);
	        this._callbacks[prefixedEventName] = this._callbacks[prefixedEventName] || [];
	        this._callbacks[prefixedEventName].push({
	            fn: callback,
	            context: context
	        });
	    };
	    CallbackRegistry.prototype.remove = function (name, callback, context) {
	        if (!name && !callback && !context) {
	            this._callbacks = {};
	            return;
	        }
	        var names = name ? [prefix(name)] : Collections.keys(this._callbacks);
	        if (callback || context) {
	            Collections.apply(names, function (name) {
	                this._callbacks[name] = Collections.filter(this._callbacks[name] || [], function (binding) {
	                    return (callback && callback !== binding.fn) ||
	                        (context && context !== binding.context);
	                });
	                if (this._callbacks[name].length === 0) {
	                    delete this._callbacks[name];
	                }
	            }, this);
	        }
	        else {
	            Collections.apply(names, function (name) {
	                delete this._callbacks[name];
	            }, this);
	        }
	    };
	    return CallbackRegistry;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = CallbackRegistry;
	function prefix(name) {
	    return "_" + name;
	}


/***/ },
/* 37 */
/***/ function(module, exports) {

	"use strict";
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
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = hooks;


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var App = __webpack_require__(44);
	var dispatcher_1 = __webpack_require__(3);
	var MAX_BUFFER_LENGTH = 256 * 1024;
	var HTTPRequest = (function (_super) {
	    __extends(HTTPRequest, _super);
	    function HTTPRequest(hooks, method, url) {
	        _super.call(this);
	        this.hooks = hooks;
	        this.method = method;
	        this.url = url;
	    }
	    HTTPRequest.prototype.start = function (payload) {
	        var self = this;
	        self.position = 0;
	        self.xhr = self.hooks.getRequest(self);
	        self.unloader = function () {
	            self.close();
	        };
	        App.addUnloadListener(self.unloader);
	        self.xhr.open(self.method, self.url, true);
	        self.xhr.send(payload);
	    };
	    HTTPRequest.prototype.close = function () {
	        if (this.unloader) {
	            App.removeUnloadListener(this.unloader);
	            this.unloader = null;
	        }
	        if (this.xhr) {
	            this.hooks.abortRequest(this.xhr);
	            this.xhr = null;
	        }
	    };
	    HTTPRequest.prototype.onChunk = function (status, data) {
	        while (true) {
	            var chunk = this.advanceBuffer(data);
	            if (chunk) {
	                this.emit("chunk", { status: status, data: chunk });
	            }
	            else {
	                break;
	            }
	        }
	        if (this.isBufferTooLong(data)) {
	            this.emit("buffer_too_long");
	        }
	    };
	    HTTPRequest.prototype.advanceBuffer = function (buffer) {
	        var unreadData = buffer.slice(this.position);
	        var endOfLinePosition = unreadData.indexOf("\n");
	        if (endOfLinePosition !== -1) {
	            this.position += endOfLinePosition + 1;
	            return unreadData.slice(0, endOfLinePosition);
	        }
	        else {
	            // chunk is not finished yet, don't move the buffer pointer
	            return null;
	        }
	    };
	    HTTPRequest.prototype.isBufferTooLong = function (buffer) {
	        return this.position === buffer.length && buffer.length > MAX_BUFFER_LENGTH;
	    };
	    return HTTPRequest;
	}(dispatcher_1.default));
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = HTTPRequest;


/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var state_1 = __webpack_require__(43);
	var util_1 = __webpack_require__(1);
	var http_1 = __webpack_require__(19);
	var runtime_1 = __webpack_require__(5);
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
	            util_1.default.defer(function () {
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
	    if (runtime_1.default.isXHRSupported()) {
	        return http_1.default.createXHR(method, url);
	    }
	    else if (runtime_1.default.isXDRSupported(url.indexOf("https:") === 0)) {
	        return http_1.default.createXDR(method, url);
	    }
	    else {
	        throw "Cross-origin HTTP requests are not supported";
	    }
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = HTTPSocket;


/***/ },
/* 40 */
/***/ function(module, exports) {

	"use strict";
	var hooks = {
	    getReceiveURL: function (url, session) {
	        return url.base + "/" + session + "/xhr_streaming" + url.queryString;
	    },
	    onHeartbeat: function (socket) {
	        socket.sendRaw("[]");
	    },
	    sendHeartbeat: function (socket) {
	        socket.sendRaw("[]");
	    },
	    onFinished: function (socket, status) {
	        socket.onClose(1006, "Connection interrupted (" + status + ")", false);
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = hooks;


/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Errors = __webpack_require__(8);
	var hooks = {
	    getRequest: function (socket) {
	        var xdr = new window.XDomainRequest();
	        xdr.ontimeout = function () {
	            socket.emit("error", new Errors.RequestTimedOut());
	            socket.close();
	        };
	        xdr.onerror = function (e) {
	            socket.emit("error", e);
	            socket.close();
	        };
	        xdr.onprogress = function () {
	            if (xdr.responseText && xdr.responseText.length > 0) {
	                socket.onChunk(200, xdr.responseText);
	            }
	        };
	        xdr.onload = function () {
	            if (xdr.responseText && xdr.responseText.length > 0) {
	                socket.onChunk(200, xdr.responseText);
	            }
	            socket.emit("finished", 200);
	            socket.close();
	        };
	        return xdr;
	    },
	    abortRequest: function (xdr) {
	        xdr.ontimeout = xdr.onerror = xdr.onprogress = xdr.onload = null;
	        xdr.abort();
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = hooks;


/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var xhr_1 = __webpack_require__(12);
	var hooks = {
	    getRequest: function (socket) {
	        var Constructor = xhr_1.default.getAPI();
	        var xhr = new Constructor();
	        xhr.onreadystatechange = xhr.onprogress = function () {
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
	    abortRequest: function (xhr) {
	        xhr.onreadystatechange = null;
	        xhr.abort();
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = hooks;


/***/ },
/* 43 */
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
/* 44 */
/***/ function(module, exports) {

	"use strict";
	exports.addUnloadListener = function (listener) {
	    // there is no "unload" callback in this environment
	};
	exports.removeUnloadListener = function (listener) {
	    // there is no "unload" callback in this environment
	};


/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var dispatcher_1 = __webpack_require__(3);
	var NetInfo = (function (_super) {
	    __extends(NetInfo, _super);
	    function NetInfo() {
	        _super.apply(this, arguments);
	    }
	    NetInfo.prototype.isOnline = function () {
	        return true;
	    };
	    return NetInfo;
	}(dispatcher_1.default));
	exports.NetInfo = NetInfo;
	exports.Network = new NetInfo();


/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var dispatcher_1 = __webpack_require__(3);
	/** Really basic interface providing network availability info.
	 *
	 * Emits:
	 * - online - when browser goes online
	 * - offline - when browser goes offline
	 */
	var NetInfo = (function (_super) {
	    __extends(NetInfo, _super);
	    function NetInfo() {
	        _super.call(this);
	        var self = this;
	        // This is okay, as IE doesn't support this stuff anyway.
	        if (window.addEventListener !== undefined) {
	            window.addEventListener("online", function () {
	                self.emit('online');
	            }, false);
	            window.addEventListener("offline", function () {
	                self.emit('offline');
	            }, false);
	        }
	    }
	    /** Returns whether browser is online or not
	     *
	     * Offline means definitely offline (no connection to router).
	     * Inverse does NOT mean definitely online (only currently supported in Safari
	     * and even there only means the device has a connection to the router).
	     *
	     * @return {Boolean}
	     */
	    NetInfo.prototype.isOnline = function () {
	        if (window.navigator.onLine === undefined) {
	            return true;
	        }
	        else {
	            return window.navigator.onLine;
	        }
	    };
	    return NetInfo;
	}(dispatcher_1.default));
	exports.NetInfo = NetInfo;
	exports.Network = new NetInfo();


/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var runtime_1 = __webpack_require__(5);
	var Collections = __webpack_require__(0);
	var dispatcher_1 = __webpack_require__(3);
	var timeline_1 = __webpack_require__(27);
	var level_1 = __webpack_require__(13);
	var StrategyBuilder = __webpack_require__(26);
	var timers_1 = __webpack_require__(6);
	var defaults_1 = __webpack_require__(7);
	var DefaultConfig = __webpack_require__(25);
	var logger_1 = __webpack_require__(4);
	var state_1 = __webpack_require__(11);
	var factory_1 = __webpack_require__(2);
	var Pusher = (function () {
	    function Pusher(app_key, options) {
	        checkAppKey(app_key);
	        options = options || {};
	        var self = this;
	        this.key = app_key;
	        this.config = Collections.extend(DefaultConfig.getGlobalConfig(), options.cluster ? DefaultConfig.getClusterConfig(options.cluster) : {}, options);
	        this.channels = factory_1.default.createChannels();
	        this.global_emitter = new dispatcher_1.default();
	        this.sessionID = Math.floor(Math.random() * 1000000000);
	        this.timeline = new timeline_1.default(this.key, this.sessionID, {
	            cluster: this.config.cluster,
	            features: runtime_1.default.getClientFeatures(),
	            params: this.config.timelineParams || {},
	            limit: 50,
	            level: level_1.default.INFO,
	            version: defaults_1.default.VERSION
	        });
	        if (!this.config.disableStats) {
	            this.timelineSender = factory_1.default.createTimelineSender(this.timeline, {
	                host: this.config.statsHost,
	                path: "/timeline/v2"
	            });
	        }
	        var getStrategy = function (options) {
	            var config = Collections.extend({}, self.config, options);
	            return StrategyBuilder.build(defaults_1.default.getDefaultStrategy(config), config);
	        };
	        this.connection = factory_1.default.createConnectionManager(this.key, Collections.extend({ getStrategy: getStrategy,
	            timeline: this.timeline,
	            activityTimeout: this.config.activity_timeout,
	            pongTimeout: this.config.pong_timeout,
	            unavailableTimeout: this.config.unavailable_timeout
	        }, this.config, { encrypted: this.isEncrypted() }));
	        this.connection.bind('connected', function () {
	            self.subscribeAll();
	            if (self.timelineSender) {
	                self.timelineSender.send(self.connection.isEncrypted());
	            }
	        });
	        this.connection.bind('message', function (params) {
	            var internal = (params.event.indexOf('pusher_internal:') === 0);
	            if (params.channel) {
	                var channel = self.channel(params.channel);
	                if (channel) {
	                    channel.handleEvent(params.event, params.data);
	                }
	            }
	            // Emit globally [deprecated]
	            if (!internal) {
	                self.global_emitter.emit(params.event, params.data);
	            }
	        });
	        this.connection.bind('disconnected', function () {
	            self.channels.disconnect();
	        });
	        this.connection.bind('error', function (err) {
	            logger_1.default.warn('Error', err);
	        });
	        Pusher.instances.push(this);
	        this.timeline.info({ instances: Pusher.instances.length });
	        if (Pusher.isReady) {
	            self.connect();
	        }
	    }
	    Pusher.ready = function () {
	        Pusher.isReady = true;
	        for (var i = 0, l = Pusher.instances.length; i < l; i++) {
	            Pusher.instances[i].connect();
	        }
	    };
	    Pusher.logToConsole = function () {
	        if (!console.log)
	            throw "Your environment doesn't have console.log. Please use Pusher.setLogger for your own custom logger.";
	        this.setLogger(function (log) {
	            console.log(log);
	        });
	    };
	    Pusher.setLogger = function (logger) {
	        logger_1.default.log = logger;
	    };
	    Pusher.prototype.channel = function (name) {
	        return this.channels.find(name);
	    };
	    Pusher.prototype.allChannels = function () {
	        return this.channels.all();
	    };
	    Pusher.prototype.connect = function () {
	        this.connection.connect();
	        if (this.timelineSender) {
	            if (!this.timelineSenderTimer) {
	                var encrypted = this.connection.isEncrypted();
	                var timelineSender = this.timelineSender;
	                this.timelineSenderTimer = new timers_1.PeriodicTimer(60000, function () {
	                    timelineSender.send(encrypted);
	                });
	            }
	        }
	    };
	    Pusher.prototype.disconnect = function () {
	        this.connection.disconnect();
	        if (this.timelineSenderTimer) {
	            this.timelineSenderTimer.ensureAborted();
	            this.timelineSenderTimer = null;
	        }
	    };
	    Pusher.prototype.bind = function (event_name, callback) {
	        this.global_emitter.bind(event_name, callback);
	        return this;
	    };
	    Pusher.prototype.bind_all = function (callback) {
	        this.global_emitter.bind_all(callback);
	        return this;
	    };
	    Pusher.prototype.subscribeAll = function () {
	        var channelName;
	        for (channelName in this.channels.channels) {
	            if (this.channels.channels.hasOwnProperty(channelName)) {
	                this.subscribe(channelName);
	            }
	        }
	    };
	    Pusher.prototype.subscribe = function (channel_name) {
	        var channel = this.channels.add(channel_name, this);
	        if (this.connection.state === state_1.default.CONNECTED) {
	            channel.subscribe();
	        }
	        return channel;
	    };
	    Pusher.prototype.unsubscribe = function (channel_name) {
	        var channel = this.channels.remove(channel_name);
	        if (channel && this.connection.state === state_1.default.CONNECTED) {
	            channel.unsubscribe();
	        }
	    };
	    Pusher.prototype.send_event = function (event_name, data, channel) {
	        return this.connection.send_event(event_name, data, channel);
	    };
	    Pusher.prototype.isEncrypted = function () {
	        if (runtime_1.default.getProtocol() === "https:") {
	            return true;
	        }
	        else {
	            return Boolean(this.config.encrypted);
	        }
	    };
	    /*  STATIC PROPERTIES */
	    Pusher.instances = [];
	    Pusher.isReady = false;
	    // for jsonp
	    Pusher.Runtime = runtime_1.default;
	    Pusher.ScriptReceivers = runtime_1.default.ScriptReceivers;
	    Pusher.DependenciesReceivers = runtime_1.default.DependenciesReceivers;
	    return Pusher;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Pusher;
	function checkAppKey(key) {
	    if (key === null || key === undefined) {
	        throw "You must pass your app key when you instantiate Pusher.";
	    }
	}
	runtime_1.default.whenReady(Pusher.ready);
	// init Pusher:
	Pusher.ready();


/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var runtime_1 = __webpack_require__(5);
	var Authorizer = (function () {
	    function Authorizer(channel, options) {
	        this.channel = channel;
	        this.type = options.authTransport;
	        this.options = options;
	        this.authOptions = (options || {}).auth || {};
	    }
	    Authorizer.prototype.composeQuery = function (socketId) {
	        var query = 'socket_id=' + encodeURIComponent(socketId) +
	            '&channel_name=' + encodeURIComponent(this.channel.name);
	        for (var i in this.authOptions.params) {
	            query += "&" + encodeURIComponent(i) + "=" + encodeURIComponent(this.authOptions.params[i]);
	        }
	        return query;
	    };
	    Authorizer.prototype.authorize = function (socketId, callback) {
	        Authorizer.authorizers = Authorizer.authorizers || runtime_1.default.getAuthorizers();
	        return Authorizer.authorizers[this.type].call(this, runtime_1.default, socketId, callback);
	    };
	    return Authorizer;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Authorizer;


/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var abstract_runtime_1 = __webpack_require__(21);
	var xhr_1 = __webpack_require__(12);
	var dependencies_1 = __webpack_require__(9);
	var auth_transports_1 = __webpack_require__(14);
	var timeline_transports_1 = __webpack_require__(23);
	var Browser = (function (_super) {
	    __extends(Browser, _super);
	    function Browser() {
	        _super.apply(this, arguments);
	    }
	    Browser.prototype.whenReady = function (callback) {
	        var _this = this;
	        var initializeOnDocumentBody = function () {
	            _this.onDocumentBody(callback);
	        };
	        if (!window.JSON) {
	            dependencies_1.Dependencies.load("json2", {}, initializeOnDocumentBody);
	        }
	        else {
	            initializeOnDocumentBody();
	        }
	    };
	    Browser.prototype.getDocument = function () {
	        return document;
	    };
	    Browser.prototype.getProtocol = function () {
	        return this.getDocument().location.protocol;
	    };
	    Browser.prototype.isXHRSupported = function () {
	        var Constructor = xhr_1.default.getAPI();
	        return Boolean(Constructor) && (new Constructor()).withCredentials !== undefined;
	    };
	    Browser.prototype.isSockJSSupported = function () {
	        return true;
	    };
	    Browser.prototype.isXDRSupported = function (encrypted) {
	        var protocol = encrypted ? "https:" : "http:";
	        var documentProtocol = this.getProtocol();
	        return Boolean((window['XDomainRequest'])) && documentProtocol === protocol;
	    };
	    Browser.prototype.getGlobal = function () {
	        return window;
	    };
	    Browser.prototype.getAuthorizers = function () {
	        return { ajax: auth_transports_1.ajax, jsonp: auth_transports_1.jsonp };
	    };
	    Browser.prototype.getTimelineTransport = function (sender, encrypted) {
	        return timeline_transports_1.jsonp(sender, encrypted);
	    };
	    Browser.prototype.onDocumentBody = function (callback) {
	        var _this = this;
	        if (document.body) {
	            callback();
	        }
	        else {
	            setTimeout(function () {
	                _this.onDocumentBody(callback);
	            }, 0);
	        }
	    };
	    return Browser;
	}(abstract_runtime_1.default));
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Browser;


/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var script_receiver_factory_1 = __webpack_require__(10);
	var runtime_1 = __webpack_require__(5);
	var factory_1 = __webpack_require__(2);
	/** Handles loading dependency files.
	 *
	 * Dependency loaders don't remember whether a resource has been loaded or
	 * not. It is caller's responsibility to make sure the resource is not loaded
	 * twice. This is because it's impossible to detect resource loading status
	 * without knowing its content.
	 *
	 * Options:
	 * - cdn_http - url to HTTP CND
	 * - cdn_https - url to HTTPS CDN
	 * - version - version of pusher-js
	 * - suffix - suffix appended to all names of dependency files
	 *
	 * @param {Object} options
	 */
	var DependencyLoader = (function () {
	    function DependencyLoader(options) {
	        this.options = options;
	        this.receivers = options.receivers || script_receiver_factory_1.ScriptReceivers;
	        this.loading = {};
	    }
	    /** Loads the dependency from CDN.
	     *
	     * @param  {String} name
	     * @param  {Function} callback
	     */
	    DependencyLoader.prototype.load = function (name, options, callback) {
	        var self = this;
	        if (self.loading[name] && self.loading[name].length > 0) {
	            self.loading[name].push(callback);
	        }
	        else {
	            self.loading[name] = [callback];
	            var request = factory_1.default.createScriptRequest(self.getPath(name, options));
	            var receiver = self.receivers.create(function (error) {
	                self.receivers.remove(receiver);
	                if (self.loading[name]) {
	                    var callbacks = self.loading[name];
	                    delete self.loading[name];
	                    var successCallback = function (wasSuccessful) {
	                        if (!wasSuccessful) {
	                            request.cleanup();
	                        }
	                    };
	                    for (var i = 0; i < callbacks.length; i++) {
	                        callbacks[i](error, successCallback);
	                    }
	                }
	            });
	            request.send(receiver);
	        }
	    };
	    DependencyLoader.prototype.getRoot = function (options) {
	        var cdn;
	        var protocol = runtime_1.default.getDocument().location.protocol;
	        if ((options && options.encrypted) || protocol === "https:") {
	            cdn = this.options.cdn_https;
	        }
	        else {
	            cdn = this.options.cdn_http;
	        }
	        // make sure there are no double slashes
	        return cdn.replace(/\/*$/, "") + "/" + this.options.version;
	    };
	    /** Returns a full path to a dependency file.
	     *
	     * @param {String} name
	     * @returns {String}
	     */
	    DependencyLoader.prototype.getPath = function (name, options) {
	        return this.getRoot(options) + '/' + name + this.options.suffix + '.js';
	    };
	    ;
	    return DependencyLoader;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = DependencyLoader;


/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Collections = __webpack_require__(0);
	var util_1 = __webpack_require__(1);
	var factory_1 = __webpack_require__(2);
	/** Sends data via JSONP.
	 *
	 * Data is a key-value map. Its values are JSON-encoded and then passed
	 * through base64. Finally, keys and encoded values are appended to the query
	 * string.
	 *
	 * The class itself does not guarantee raising errors on failures, as it's not
	 * possible to support such feature on all browsers. Instead, JSONP endpoint
	 * should call back in a way that's easy to distinguish from browser calls,
	 * for example by passing a second argument to the receiver.
	 *
	 * @param {String} url
	 * @param {Object} data key-value map of data to be submitted
	 */
	var JSONPRequest = (function () {
	    function JSONPRequest(url, data) {
	        this.url = url;
	        this.data = data;
	    }
	    /** Sends the actual JSONP request.
	     *
	     * @param {ScriptReceiver} receiver
	     */
	    JSONPRequest.prototype.send = function (receiver) {
	        if (this.request) {
	            return;
	        }
	        var params = Collections.filterObject(this.data, function (value) {
	            return value !== undefined;
	        });
	        var query = Collections.map(Collections.flatten(Collections.encodeParamsObject(params)), util_1.default.method("join", "=")).join("&");
	        var url = this.url + "/" + receiver.number + "?" + query;
	        this.request = factory_1.default.createScriptRequest(url);
	        this.request.send(receiver);
	    };
	    /** Cleans up the DOM remains of the JSONP request. */
	    JSONPRequest.prototype.cleanup = function () {
	        if (this.request) {
	            this.request.cleanup();
	        }
	    };
	    return JSONPRequest;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = JSONPRequest;


/***/ },
/* 52 */
/***/ function(module, exports) {

	"use strict";
	/** Sends a generic HTTP GET request using a script tag.
	 *
	 * By constructing URL in a specific way, it can be used for loading
	 * JavaScript resources or JSONP requests. It can notify about errors, but
	 * only in certain environments. Please take care of monitoring the state of
	 * the request yourself.
	 *
	 * @param {String} src
	 */
	var ScriptRequest = (function () {
	    function ScriptRequest(src) {
	        this.src = src;
	    }
	    ScriptRequest.prototype.send = function (receiver) {
	        var self = this;
	        var errorString = "Error loading " + self.src;
	        self.script = document.createElement("script");
	        self.script.id = receiver.id;
	        self.script.src = self.src;
	        self.script.type = "text/javascript";
	        self.script.charset = "UTF-8";
	        if (self.script.addEventListener) {
	            self.script.onerror = function () {
	                receiver.callback(errorString);
	            };
	            self.script.onload = function () {
	                receiver.callback(null);
	            };
	        }
	        else {
	            self.script.onreadystatechange = function () {
	                if (self.script.readyState === 'loaded' ||
	                    self.script.readyState === 'complete') {
	                    receiver.callback(null);
	                }
	            };
	        }
	        // Opera<11.6 hack for missing onerror callback
	        if (self.script.async === undefined && document.attachEvent &&
	            /opera/i.test(navigator.userAgent)) {
	            self.errorScript = document.createElement("script");
	            self.errorScript.id = receiver.id + "_error";
	            self.errorScript.text = receiver.name + "('" + errorString + "');";
	            self.script.async = self.errorScript.async = false;
	        }
	        else {
	            self.script.async = true;
	        }
	        var head = document.getElementsByTagName('head')[0];
	        head.insertBefore(self.script, head.firstChild);
	        if (self.errorScript) {
	            head.insertBefore(self.errorScript, self.script.nextSibling);
	        }
	    };
	    /** Cleans up the DOM remains of the script request. */
	    ScriptRequest.prototype.cleanup = function () {
	        if (this.script) {
	            this.script.onload = this.script.onerror = null;
	            this.script.onreadystatechange = null;
	        }
	        if (this.script && this.script.parentNode) {
	            this.script.parentNode.removeChild(this.script);
	        }
	        if (this.errorScript && this.errorScript.parentNode) {
	            this.errorScript.parentNode.removeChild(this.errorScript);
	        }
	        this.script = null;
	        this.errorScript = null;
	    };
	    return ScriptRequest;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = ScriptRequest;


/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var abstract_runtime_1 = __webpack_require__(21);
	var Isomorphic = (function (_super) {
	    __extends(Isomorphic, _super);
	    function Isomorphic() {
	        _super.apply(this, arguments);
	    }
	    Isomorphic.prototype.whenReady = function (callback) {
	        callback();
	    };
	    Isomorphic.prototype.getProtocol = function () {
	        return "http:";
	    };
	    Isomorphic.prototype.isXHRSupported = function () {
	        return true;
	    };
	    Isomorphic.prototype.isXDRSupported = function (encrypted) {
	        return false;
	    };
	    Isomorphic.prototype.isSockJSSupported = function () {
	        return false;
	    };
	    Isomorphic.prototype.getGlobal = function () {
	        return Function("return this")();
	    };
	    Isomorphic.prototype.getDocument = function () {
	        throw ("Isomorphic runtime detected, but getDocument alled. Please raise an issue on pusher/pusher-websocket-js-iso");
	    };
	    return Isomorphic;
	}(abstract_runtime_1.default));
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Isomorphic;


/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Collections = __webpack_require__(0);
	var util_1 = __webpack_require__(1);
	/** Launches all substrategies and emits prioritized connected transports.
	 *
	 * @param {Array} strategies
	 */
	var BestConnectedEverStrategy = (function () {
	    function BestConnectedEverStrategy(strategies) {
	        this.strategies = strategies;
	    }
	    BestConnectedEverStrategy.prototype.isSupported = function () {
	        return Collections.any(this.strategies, util_1.default.method("isSupported"));
	    };
	    BestConnectedEverStrategy.prototype.connect = function (minPriority, callback) {
	        return connect(this.strategies, minPriority, function (i, runners) {
	            return function (error, handshake) {
	                runners[i].error = error;
	                if (error) {
	                    if (allRunnersFailed(runners)) {
	                        callback(true);
	                    }
	                    return;
	                }
	                Collections.apply(runners, function (runner) {
	                    runner.forceMinPriority(handshake.transport.priority);
	                });
	                callback(null, handshake);
	            };
	        });
	    };
	    return BestConnectedEverStrategy;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = BestConnectedEverStrategy;
	/** Connects to all strategies in parallel.
	 *
	 * Callback builder should be a function that takes two arguments: index
	 * and a list of runners. It should return another function that will be
	 * passed to the substrategy with given index. Runners can be aborted using
	 * abortRunner(s) functions from this class.
	 *
	 * @param  {Array} strategies
	 * @param  {Function} callbackBuilder
	 * @return {Object} strategy runner
	 */
	function connect(strategies, minPriority, callbackBuilder) {
	    var runners = Collections.map(strategies, function (strategy, i, _, rs) {
	        return strategy.connect(minPriority, callbackBuilder(i, rs));
	    });
	    return {
	        abort: function () {
	            Collections.apply(runners, abortRunner);
	        },
	        forceMinPriority: function (p) {
	            Collections.apply(runners, function (runner) {
	                runner.forceMinPriority(p);
	            });
	        }
	    };
	}
	function allRunnersFailed(runners) {
	    return Collections.all(runners, function (runner) {
	        return Boolean(runner.error);
	    });
	}
	function abortRunner(runner) {
	    if (!runner.error && !runner.aborted) {
	        runner.abort();
	        runner.aborted = true;
	    }
	}


/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var util_1 = __webpack_require__(1);
	var runtime_1 = __webpack_require__(5);
	var sequential_strategy_1 = __webpack_require__(22);
	/** Caches last successful transport and uses it for following attempts.
	 *
	 * @param {Strategy} strategy
	 * @param {Object} transports
	 * @param {Object} options
	 */
	var CachedStrategy = (function () {
	    function CachedStrategy(strategy, transports, options) {
	        this.strategy = strategy;
	        this.transports = transports;
	        this.ttl = options.ttl || 1800 * 1000;
	        this.encrypted = options.encrypted;
	        this.timeline = options.timeline;
	    }
	    CachedStrategy.prototype.isSupported = function () {
	        return this.strategy.isSupported();
	    };
	    CachedStrategy.prototype.connect = function (minPriority, callback) {
	        var encrypted = this.encrypted;
	        var info = fetchTransportCache(encrypted);
	        var strategies = [this.strategy];
	        if (info && info.timestamp + this.ttl >= util_1.default.now()) {
	            var transport = this.transports[info.transport];
	            if (transport) {
	                this.timeline.info({
	                    cached: true,
	                    transport: info.transport,
	                    latency: info.latency
	                });
	                strategies.push(new sequential_strategy_1.default([transport], {
	                    timeout: info.latency * 2 + 1000,
	                    failFast: true
	                }));
	            }
	        }
	        var startTimestamp = util_1.default.now();
	        var runner = strategies.pop().connect(minPriority, function cb(error, handshake) {
	            if (error) {
	                flushTransportCache(encrypted);
	                if (strategies.length > 0) {
	                    startTimestamp = util_1.default.now();
	                    runner = strategies.pop().connect(minPriority, cb);
	                }
	                else {
	                    callback(error);
	                }
	            }
	            else {
	                storeTransportCache(encrypted, handshake.transport.name, util_1.default.now() - startTimestamp);
	                callback(null, handshake);
	            }
	        });
	        return {
	            abort: function () {
	                runner.abort();
	            },
	            forceMinPriority: function (p) {
	                minPriority = p;
	                if (runner) {
	                    runner.forceMinPriority(p);
	                }
	            }
	        };
	    };
	    return CachedStrategy;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = CachedStrategy;
	function getTransportCacheKey(encrypted) {
	    return "pusherTransport" + (encrypted ? "Encrypted" : "Unencrypted");
	}
	function fetchTransportCache(encrypted) {
	    var storage = runtime_1.default.getLocalStorage();
	    if (storage) {
	        try {
	            var serializedCache = storage[getTransportCacheKey(encrypted)];
	            if (serializedCache) {
	                return JSON.parse(serializedCache);
	            }
	        }
	        catch (e) {
	            flushTransportCache(encrypted);
	        }
	    }
	    return null;
	}
	function storeTransportCache(encrypted, transport, latency) {
	    var storage = runtime_1.default.getLocalStorage();
	    if (storage) {
	        try {
	            storage[getTransportCacheKey(encrypted)] = JSON.stringify({
	                timestamp: util_1.default.now(),
	                transport: transport,
	                latency: latency
	            });
	        }
	        catch (e) {
	        }
	    }
	}
	function flushTransportCache(encrypted) {
	    var storage = runtime_1.default.getLocalStorage();
	    if (storage) {
	        try {
	            delete storage[getTransportCacheKey(encrypted)];
	        }
	        catch (e) {
	        }
	    }
	}


/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var timers_1 = __webpack_require__(6);
	/** Runs substrategy after specified delay.
	 *
	 * Options:
	 * - delay - time in miliseconds to delay the substrategy attempt
	 *
	 * @param {Strategy} strategy
	 * @param {Object} options
	 */
	var DelayedStrategy = (function () {
	    function DelayedStrategy(strategy, _a) {
	        var number = _a.delay;
	        this.strategy = strategy;
	        this.options = { delay: number };
	    }
	    DelayedStrategy.prototype.isSupported = function () {
	        return this.strategy.isSupported();
	    };
	    DelayedStrategy.prototype.connect = function (minPriority, callback) {
	        var strategy = this.strategy;
	        var runner;
	        var timer = new timers_1.OneOffTimer(this.options.delay, function () {
	            runner = strategy.connect(minPriority, callback);
	        });
	        return {
	            abort: function () {
	                timer.ensureAborted();
	                if (runner) {
	                    runner.abort();
	                }
	            },
	            forceMinPriority: function (p) {
	                minPriority = p;
	                if (runner) {
	                    runner.forceMinPriority(p);
	                }
	            }
	        };
	    };
	    return DelayedStrategy;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = DelayedStrategy;


/***/ },
/* 57 */
/***/ function(module, exports) {

	"use strict";
	/** Launches the substrategy and terminates on the first open connection.
	 *
	 * @param {Strategy} strategy
	 */
	var FirstConnectedStrategy = (function () {
	    function FirstConnectedStrategy(strategy) {
	        this.strategy = strategy;
	    }
	    FirstConnectedStrategy.prototype.isSupported = function () {
	        return this.strategy.isSupported();
	    };
	    FirstConnectedStrategy.prototype.connect = function (minPriority, callback) {
	        var runner = this.strategy.connect(minPriority, function (error, handshake) {
	            if (handshake) {
	                runner.abort();
	            }
	            callback(error, handshake);
	        });
	        return runner;
	    };
	    return FirstConnectedStrategy;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = FirstConnectedStrategy;


/***/ },
/* 58 */
/***/ function(module, exports) {

	"use strict";
	/** Proxies method calls to one of substrategies basing on the test function.
	 *
	 * @param {Function} test
	 * @param {Strategy} trueBranch strategy used when test returns true
	 * @param {Strategy} falseBranch strategy used when test returns false
	 */
	var IfStrategy = (function () {
	    function IfStrategy(test, trueBranch, falseBranch) {
	        this.test = test;
	        this.trueBranch = trueBranch;
	        this.falseBranch = falseBranch;
	    }
	    IfStrategy.prototype.isSupported = function () {
	        var branch = this.test() ? this.trueBranch : this.falseBranch;
	        return branch.isSupported();
	    };
	    IfStrategy.prototype.connect = function (minPriority, callback) {
	        var branch = this.test() ? this.trueBranch : this.falseBranch;
	        return branch.connect(minPriority, callback);
	    };
	    return IfStrategy;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = IfStrategy;


/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var factory_1 = __webpack_require__(2);
	var util_1 = __webpack_require__(1);
	var Errors = __webpack_require__(8);
	/** Provides a strategy interface for transports.
	 *
	 * @param {String} name
	 * @param {Number} priority
	 * @param {Class} transport
	 * @param {Object} options
	 */
	var TransportStrategy = (function () {
	    function TransportStrategy(name, priority, transport, options) {
	        this.name = name;
	        this.priority = priority;
	        this.transport = transport;
	        this.options = options || {};
	    }
	    /** Returns whether the transport is supported in the browser.
	     *
	     * @returns {Boolean}
	     */
	    TransportStrategy.prototype.isSupported = function () {
	        return this.transport.isSupported({
	            encrypted: this.options.encrypted
	        });
	    };
	    /** Launches a connection attempt and returns a strategy runner.
	     *
	     * @param  {Function} callback
	     * @return {Object} strategy runner
	     */
	    TransportStrategy.prototype.connect = function (minPriority, callback) {
	        if (!this.isSupported()) {
	            return failAttempt(new Errors.UnsupportedStrategy(), callback);
	        }
	        else if (this.priority < minPriority) {
	            return failAttempt(new Errors.TransportPriorityTooLow(), callback);
	        }
	        var self = this;
	        var connected = false;
	        var transport = this.transport.createConnection(this.name, this.priority, this.options.key, this.options);
	        var handshake = null;
	        var onInitialized = function () {
	            transport.unbind("initialized", onInitialized);
	            transport.connect();
	        };
	        var onOpen = function () {
	            handshake = factory_1.default.createHandshake(transport, function (result) {
	                connected = true;
	                unbindListeners();
	                callback(null, result);
	            });
	        };
	        var onError = function (error) {
	            unbindListeners();
	            callback(error);
	        };
	        var onClosed = function () {
	            unbindListeners();
	            callback(new Errors.TransportClosed(JSON.stringify(transport)));
	        };
	        var unbindListeners = function () {
	            transport.unbind("initialized", onInitialized);
	            transport.unbind("open", onOpen);
	            transport.unbind("error", onError);
	            transport.unbind("closed", onClosed);
	        };
	        transport.bind("initialized", onInitialized);
	        transport.bind("open", onOpen);
	        transport.bind("error", onError);
	        transport.bind("closed", onClosed);
	        // connect will be called automatically after initialization
	        transport.initialize();
	        return {
	            abort: function () {
	                if (connected) {
	                    return;
	                }
	                unbindListeners();
	                if (handshake) {
	                    handshake.close();
	                }
	                else {
	                    transport.close();
	                }
	            },
	            forceMinPriority: function (p) {
	                if (connected) {
	                    return;
	                }
	                if (self.priority < p) {
	                    if (handshake) {
	                        handshake.close();
	                    }
	                    else {
	                        transport.close();
	                    }
	                }
	            }
	        };
	    };
	    return TransportStrategy;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = TransportStrategy;
	function failAttempt(error, callback) {
	    util_1.default.defer(function () {
	        callback(error);
	    });
	    return {
	        abort: function () { },
	        forceMinPriority: function () { }
	    };
	}


/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var runtime_1 = __webpack_require__(5);
	var TimelineSender = (function () {
	    function TimelineSender(timeline, options) {
	        this.timeline = timeline;
	        this.options = options || {};
	    }
	    TimelineSender.prototype.send = function (encrypted, callback) {
	        var self = this;
	        if (self.timeline.isEmpty()) {
	            return;
	        }
	        self.timeline.send(runtime_1.default.getTimelineTransport(this, encrypted), callback);
	    };
	    return TimelineSender;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = TimelineSender;


/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var util_1 = __webpack_require__(1);
	var Collections = __webpack_require__(0);
	/** Creates transport connections monitored by a transport manager.
	 *
	 * When a transport is closed, it might mean the environment does not support
	 * it. It's possible that messages get stuck in an intermediate buffer or
	 * proxies terminate inactive connections. To combat these problems,
	 * assistants monitor the connection lifetime, report unclean exits and
	 * adjust ping timeouts to keep the connection active. The decision to disable
	 * a transport is the manager's responsibility.
	 *
	 * @param {TransportManager} manager
	 * @param {TransportConnection} transport
	 * @param {Object} options
	 */
	var AssistantToTheTransportManager = (function () {
	    function AssistantToTheTransportManager(manager, transport, options) {
	        this.manager = manager;
	        this.transport = transport;
	        this.minPingDelay = options.minPingDelay;
	        this.maxPingDelay = options.maxPingDelay;
	        this.pingDelay = undefined;
	    }
	    /** Creates a transport connection.
	     *
	     * This function has the same API as Transport#createConnection.
	     *
	     * @param {String} name
	     * @param {Number} priority
	     * @param {String} key the application key
	     * @param {Object} options
	     * @returns {TransportConnection}
	     */
	    AssistantToTheTransportManager.prototype.createConnection = function (name, priority, key, options) {
	        var self = this;
	        options = Collections.extend({}, options, {
	            activityTimeout: self.pingDelay
	        });
	        var connection = self.transport.createConnection(name, priority, key, options);
	        var openTimestamp = null;
	        var onOpen = function () {
	            connection.unbind("open", onOpen);
	            connection.bind("closed", onClosed);
	            openTimestamp = util_1.default.now();
	        };
	        var onClosed = function (closeEvent) {
	            connection.unbind("closed", onClosed);
	            if (closeEvent.code === 1002 || closeEvent.code === 1003) {
	                // we don't want to use transports not obeying the protocol
	                self.manager.reportDeath();
	            }
	            else if (!closeEvent.wasClean && openTimestamp) {
	                // report deaths only for short-living transport
	                var lifespan = util_1.default.now() - openTimestamp;
	                if (lifespan < 2 * self.maxPingDelay) {
	                    self.manager.reportDeath();
	                    self.pingDelay = Math.max(lifespan / 2, self.minPingDelay);
	                }
	            }
	        };
	        connection.bind("open", onOpen);
	        return connection;
	    };
	    /** Returns whether the transport is supported in the environment.
	     *
	     * This function has the same API as Transport#isSupported. Might return false
	     * when the manager decides to kill the transport.
	     *
	     * @param {Object} environment the environment details (encryption, settings)
	     * @returns {Boolean} true when the transport is supported
	     */
	    AssistantToTheTransportManager.prototype.isSupported = function (environment) {
	        return this.manager.isAlive() && this.transport.isSupported(environment);
	    };
	    return AssistantToTheTransportManager;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = AssistantToTheTransportManager;


/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var transport_connection_1 = __webpack_require__(63);
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
	        return new transport_connection_1.default(this.hooks, name, priority, key, options);
	    };
	    return Transport;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Transport;


/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var util_1 = __webpack_require__(1);
	var Collections = __webpack_require__(0);
	var dispatcher_1 = __webpack_require__(3);
	var logger_1 = __webpack_require__(4);
	var state_1 = __webpack_require__(11);
	var dependencies_1 = __webpack_require__(9);
	/** Provides universal API for transport connections.
	 *
	 * Transport connection is a low-level object that wraps a connection method
	 * and exposes a simple evented interface for the connection state and
	 * messaging. It does not implement Pusher-specific WebSocket protocol.
	 *
	 * Additionally, it fetches resources needed for transport to work and exposes
	 * an interface for querying transport features.
	 *
	 * States:
	 * - new - initial state after constructing the object
	 * - initializing - during initialization phase, usually fetching resources
	 * - intialized - ready to establish a connection
	 * - connection - when connection is being established
	 * - open - when connection ready to be used
	 * - closed - after connection was closed be either side
	 *
	 * Emits:
	 * - error - after the connection raised an error
	 *
	 * Options:
	 * - encrypted - whether connection should use ssl
	 * - hostEncrypted - host to connect to when connection is encrypted
	 * - hostUnencrypted - host to connect to when connection is not encrypted
	 *
	 * @param {String} key application key
	 * @param {Object} options
	 */
	var TransportConnection = (function (_super) {
	    __extends(TransportConnection, _super);
	    function TransportConnection(hooks, name, priority, key, options) {
	        _super.call(this);
	        this.hooks = hooks;
	        this.name = name;
	        this.priority = priority;
	        this.key = key;
	        this.options = options;
	        this.state = state_1.default.NEW;
	        this.timeline = options.timeline;
	        this.activityTimeout = options.activityTimeout;
	        this.id = this.timeline.generateUniqueID();
	    }
	    /** Checks whether the transport handles activity checks by itself.
	     *
	     * @return {Boolean}
	     */
	    TransportConnection.prototype.handlesActivityChecks = function () {
	        return Boolean(this.hooks.handlesActivityChecks);
	    };
	    /** Checks whether the transport supports the ping/pong API.
	     *
	     * @return {Boolean}
	     */
	    TransportConnection.prototype.supportsPing = function () {
	        return Boolean(this.hooks.supportsPing);
	    };
	    /** Initializes the transport.
	     *
	     * Fetches resources if needed and then transitions to initialized.
	     */
	    TransportConnection.prototype.initialize = function () {
	        var self = this;
	        self.timeline.info(self.buildTimelineMessage({
	            transport: self.name + (self.options.encrypted ? "s" : "")
	        }));
	        if (self.hooks.isInitialized()) {
	            self.changeState(state_1.default.INITIALIZED);
	        }
	        else if (self.hooks.file) {
	            self.changeState(state_1.default.INITIALIZING);
	            dependencies_1.Dependencies.load(self.hooks.file, { encrypted: self.options.encrypted }, function (error, callback) {
	                if (self.hooks.isInitialized()) {
	                    self.changeState(state_1.default.INITIALIZED);
	                    callback(true);
	                }
	                else {
	                    if (error) {
	                        self.onError(error);
	                    }
	                    self.onClose();
	                    callback(false);
	                }
	            });
	        }
	        else {
	            self.onClose();
	        }
	    };
	    /** Tries to establish a connection.
	     *
	     * @returns {Boolean} false if transport is in invalid state
	     */
	    TransportConnection.prototype.connect = function () {
	        var self = this;
	        if (self.socket || self.state !== state_1.default.INITIALIZED) {
	            return false;
	        }
	        var url = self.hooks.urls.getInitial(self.key, self.options);
	        try {
	            self.socket = self.hooks.getSocket(url, self.options);
	        }
	        catch (e) {
	            util_1.default.defer(function () {
	                self.onError(e);
	                self.changeState(state_1.default.CLOSED);
	            });
	            return false;
	        }
	        self.bindListeners();
	        logger_1.default.debug("Connecting", { transport: self.name, url: url });
	        self.changeState(state_1.default.CONNECTING);
	        return true;
	    };
	    /** Closes the connection.
	     *
	     * @return {Boolean} true if there was a connection to close
	     */
	    TransportConnection.prototype.close = function () {
	        if (this.socket) {
	            this.socket.close();
	            return true;
	        }
	        else {
	            return false;
	        }
	    };
	    /** Sends data over the open connection.
	     *
	     * @param {String} data
	     * @return {Boolean} true only when in the "open" state
	     */
	    TransportConnection.prototype.send = function (data) {
	        var self = this;
	        if (self.state === state_1.default.OPEN) {
	            // Workaround for MobileSafari bug (see https://gist.github.com/2052006)
	            util_1.default.defer(function () {
	                if (self.socket) {
	                    self.socket.send(data);
	                }
	            });
	            return true;
	        }
	        else {
	            return false;
	        }
	    };
	    /** Sends a ping if the connection is open and transport supports it. */
	    TransportConnection.prototype.ping = function () {
	        if (this.state === state_1.default.OPEN && this.supportsPing()) {
	            this.socket.ping();
	        }
	    };
	    /** @private */
	    TransportConnection.prototype.onOpen = function () {
	        if (this.hooks.beforeOpen) {
	            this.hooks.beforeOpen(this.socket, this.hooks.urls.getPath(this.key, this.options));
	        }
	        this.changeState(state_1.default.OPEN);
	        this.socket.onopen = undefined;
	    };
	    /** @private */
	    TransportConnection.prototype.onError = function (error) {
	        this.emit("error", { type: 'WebSocketError', error: error });
	        this.timeline.error(this.buildTimelineMessage({ error: error.toString() }));
	    };
	    /** @private */
	    TransportConnection.prototype.onClose = function (closeEvent) {
	        if (closeEvent) {
	            this.changeState(state_1.default.CLOSED, {
	                code: closeEvent.code,
	                reason: closeEvent.reason,
	                wasClean: closeEvent.wasClean
	            });
	        }
	        else {
	            this.changeState(state_1.default.CLOSED);
	        }
	        this.unbindListeners();
	        this.socket = undefined;
	    };
	    /** @private */
	    TransportConnection.prototype.onMessage = function (message) {
	        this.emit("message", message);
	    };
	    /** @private */
	    TransportConnection.prototype.onActivity = function () {
	        this.emit("activity");
	    };
	    /** @private */
	    TransportConnection.prototype.bindListeners = function () {
	        var self = this;
	        self.socket.onopen = function () {
	            self.onOpen();
	        };
	        self.socket.onerror = function (error) {
	            self.onError(error);
	        };
	        self.socket.onclose = function (closeEvent) {
	            self.onClose(closeEvent);
	        };
	        self.socket.onmessage = function (message) {
	            self.onMessage(message);
	        };
	        if (self.supportsPing()) {
	            self.socket.onactivity = function () { self.onActivity(); };
	        }
	    };
	    /** @private */
	    TransportConnection.prototype.unbindListeners = function () {
	        if (this.socket) {
	            this.socket.onopen = undefined;
	            this.socket.onerror = undefined;
	            this.socket.onclose = undefined;
	            this.socket.onmessage = undefined;
	            if (this.supportsPing()) {
	                this.socket.onactivity = undefined;
	            }
	        }
	    };
	    /** @private */
	    TransportConnection.prototype.changeState = function (state, params) {
	        this.state = state;
	        this.timeline.info(this.buildTimelineMessage({
	            state: state,
	            params: params
	        }));
	        this.emit(state, params);
	    };
	    TransportConnection.prototype.buildTimelineMessage = function (message) {
	        return Collections.extend({ cid: this.id }, message);
	    };
	    return TransportConnection;
	}(dispatcher_1.default));
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = TransportConnection;


/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var factory_1 = __webpack_require__(2);
	/** Keeps track of the number of lives left for a transport.
	 *
	 * In the beginning of a session, transports may be assigned a number of
	 * lives. When an AssistantToTheTransportManager instance reports a transport
	 * connection closed uncleanly, the transport loses a life. When the number
	 * of lives drops to zero, the transport gets disabled by its manager.
	 *
	 * @param {Object} options
	 */
	var TransportManager = (function () {
	    function TransportManager(options) {
	        this.options = options || [];
	        this.livesLeft = this.options.lives || Infinity;
	    }
	    /** Creates a assistant for the transport.
	     *
	     * @param {Transport} transport
	     * @returns {AssistantToTheTransportManager}
	     */
	    TransportManager.prototype.getAssistant = function (transport) {
	        return factory_1.default.createAssistantToTheTransportManager(this, transport, {
	            minPingDelay: this.options.minPingDelay,
	            maxPingDelay: this.options.maxPingDelay
	        });
	    };
	    /** Returns whether the transport has any lives left.
	     *
	     * @returns {Boolean}
	     */
	    TransportManager.prototype.isAlive = function () {
	        return this.livesLeft > 0;
	    };
	    /** Takes one life from the transport. */
	    TransportManager.prototype.reportDeath = function () {
	        this.livesLeft -= 1;
	    };
	    return TransportManager;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = TransportManager;


/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var defaults_ts_1 = __webpack_require__(7);
	function getGenericURL(baseScheme, params, path) {
	    var scheme = baseScheme + (params.encrypted ? "s" : "");
	    var host = params.encrypted ? params.hostEncrypted : params.hostUnencrypted;
	    return scheme + "://" + host + path;
	}
	function getGenericPath(key, queryString) {
	    var path = "/app/" + key;
	    var query = "?protocol=" + defaults_ts_1.default.PROTOCOL +
	        "&client=js" +
	        "&version=" + defaults_ts_1.default.VERSION +
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
	exports.sockjs = {
	    getInitial: function (key, params) {
	        return getGenericURL("http", params, params.httpPath || "/pusher");
	    },
	    getPath: function (key, params) {
	        return getGenericPath(key);
	    }
	};


/***/ },
/* 66 */
/***/ function(module, exports) {

	"use strict";
	var Timer = (function () {
	    function Timer(set, clear, delay, callback) {
	        var _this = this;
	        this.clear = clear;
	        this.timer = set(function () {
	            if (_this.timer) {
	                _this.timer = callback(_this.timer);
	            }
	        }, delay);
	    }
	    /** Returns whether the timer is still running.
	     *
	     * @return {Boolean}
	     */
	    Timer.prototype.isRunning = function () {
	        return this.timer !== null;
	    };
	    /** Aborts a timer when it's running. */
	    Timer.prototype.ensureAborted = function () {
	        if (this.timer) {
	            this.clear(this.timer);
	            this.timer = null;
	        }
	    };
	    return Timer;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Timer;


/***/ }
/******/ ]);