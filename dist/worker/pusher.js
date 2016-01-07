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

	var Util = __webpack_require__(1);
	var Channels = __webpack_require__(21);
	var EventsDispatcher = __webpack_require__(7);
	var Timeline = __webpack_require__(28);
	var TimelineSender = __webpack_require__(29);
	var StrategyBuilder = __webpack_require__(31);
	var ConnectionManager = __webpack_require__(44);
	var PeriodicTimer = __webpack_require__(3).PeriodicTimer;
	var Defaults = __webpack_require__(10);
	var DefaultConfig = __webpack_require__(46);
	var Logger = __webpack_require__(8);

	function Pusher(app_key, options) {

	  if (!this instanceof Pusher) {
	    return new Pusher(arguments);
	  }

	  checkAppKey(app_key);
	  options = options || {};

	  var self = this;

	  this.key = app_key;
	  this.config = Util.extend(
	    DefaultConfig.getGlobalConfig(),
	    options.cluster ? DefaultConfig.getClusterConfig(options.cluster) : {},
	    options
	  );

	  this.channels = new Channels();
	  this.global_emitter = new EventsDispatcher();
	  this.sessionID = Math.floor(Math.random() * 1000000000);

	  this.timeline = new Timeline(this.key, this.sessionID, {
	    cluster: this.config.cluster,
	    features: Util.getClientFeatures(),
	    params: this.config.timelineParams || {},
	    limit: 50,
	    level: Timeline.INFO,
	    version: Pusher.VERSION
	  });
	  if (!this.config.disableStats) {
	    this.timelineSender = new TimelineSender(this.timeline, {
	      host: this.config.statsHost,
	      path: "/timeline/v2/jsonp"
	    });
	  }

	  var getStrategy = function(options) {
	    var config = Util.extend({}, self.config, options);
	    return StrategyBuilder.build(
	      Defaults.getDefaultStrategy(config), config
	    );
	  };

	  this.connection = new ConnectionManager(
	    this.key,
	    Util.extend(
	      { getStrategy: getStrategy,
	        timeline: this.timeline,
	        activityTimeout: this.config.activity_timeout,
	        pongTimeout: this.config.pong_timeout,
	        unavailableTimeout: this.config.unavailable_timeout
	      },
	      this.config,
	      { encrypted: this.isEncrypted() }
	    )
	  );

	  this.connection.bind('connected', function() {
	    self.subscribeAll();
	    if (self.timelineSender) {
	      self.timelineSender.send(self.connection.isEncrypted());
	    }
	  });
	  this.connection.bind('message', function(params) {
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
	  this.connection.bind('disconnected', function() {
	    self.channels.disconnect();
	  });
	  this.connection.bind('error', function(err) {
	    Logger.warn('Error', err);
	  });

	  Pusher.instances.push(this);
	  this.timeline.info({ instances: Pusher.instances.length });

	  if (Pusher.isReady) {
	    self.connect();
	  }
	}
	var prototype = Pusher.prototype;

	Pusher.instances = [];
	Pusher.isReady = false;

	Pusher.ready = function() {
	  Pusher.isReady = true;
	  for (var i = 0, l = Pusher.instances.length; i < l; i++) {
	    Pusher.instances[i].connect();
	  }
	};

	Pusher.setLogger = function(logger){
	  Logger.log = logger;
	}

	prototype.channel = function(name) {
	  return this.channels.find(name);
	};

	prototype.allChannels = function() {
	  return this.channels.all();
	};

	prototype.connect = function() {
	  this.connection.connect();

	  if (this.timelineSender) {
	    if (!this.timelineSenderTimer) {
	      var encrypted = this.connection.isEncrypted();
	      var timelineSender = this.timelineSender;
	      this.timelineSenderTimer = new PeriodicTimer(60000, function() {
	        timelineSender.send(encrypted);
	      });
	    }
	  }
	};

	prototype.disconnect = function() {
	  this.connection.disconnect();

	  if (this.timelineSenderTimer) {
	    this.timelineSenderTimer.ensureAborted();
	    this.timelineSenderTimer = null;
	  }
	};

	prototype.bind = function(event_name, callback) {
	  this.global_emitter.bind(event_name, callback);
	  return this;
	};

	prototype.bind_all = function(callback) {
	  this.global_emitter.bind_all(callback);
	  return this;
	};

	prototype.subscribeAll = function() {
	  var channelName;
	  for (channelName in this.channels.channels) {
	    if (this.channels.channels.hasOwnProperty(channelName)) {
	      this.subscribe(channelName);
	    }
	  }
	};

	prototype.subscribe = function(channel_name) {
	  var channel = this.channels.add(channel_name, this);
	  if (this.connection.state === 'connected') {
	    channel.subscribe();
	  }
	  return channel;
	};

	prototype.unsubscribe = function(channel_name) {
	  var channel = this.channels.remove(channel_name);
	  if (channel && this.connection.state === 'connected') {
	    channel.unsubscribe();
	  }
	};

	prototype.send_event = function(event_name, data, channel) {
	  return this.connection.send_event(event_name, data, channel);
	};

	prototype.isEncrypted = function() {
	  if (Util.getProtocol() === "https:") {
	    return true;
	  } else {
	    return Boolean(this.config.encrypted);
	  }
	};

	function checkAppKey(key) {
	  if (key === null || key === undefined) {
	    Logger.warn(
	      'Warning', 'You must pass your app key when you instantiate Pusher.'
	    );
	  }
	}

	// init Pusher:
	Pusher.ready()

	module.exports = Pusher;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var XHR = __webpack_require__(2);

	module.exports = Util = {
	  now: function() {
	    if (Date.now) {
	      return Date.now();
	    } else {
	      return new Date().valueOf();
	    }
	  },

	  defer: function(callback) {
	    var Timer = __webpack_require__(3).Timer;
	    return new Timer(0, callback);
	  },

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
	  extend: function(target) {
	    var self = this;
	    for (var i = 1; i < arguments.length; i++) {
	      var extensions = arguments[i];
	      for (var property in extensions) {
	        if (extensions[property] && extensions[property].constructor &&
	            extensions[property].constructor === Object) {
	          target[property] = self.extend(
	            target[property] || {}, extensions[property]
	          );
	        } else {
	          target[property] = extensions[property];
	        }
	      }
	    }
	    return target;
	  },

	  stringify: function() {
	    var m = ["Pusher"];
	    for (var i = 0; i < arguments.length; i++) {
	      if (typeof arguments[i] === "string") {
	        m.push(arguments[i]);
	      } else {
	        m.push(JSON.stringify(arguments[i]));
	      }
	    }
	    return m.join(" : ");
	  },

	  arrayIndexOf: function(array, item) { // MSIE doesn't have array.indexOf
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
	  },

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
	  objectApply: function(object, f) {
	    for (var key in object) {
	      if (Object.prototype.hasOwnProperty.call(object, key)) {
	        f(object[key], key, object);
	      }
	    }
	  },

	  /** Return a list of object's own property keys
	   *
	   * @param {Object} object
	   * @returns {Array}
	   */
	  keys: function(object) {
	    var keys = [];
	    this.objectApply(object, function(_, key) {
	      keys.push(key);
	    });
	    return keys;
	  },

	  /** Return a list of object's own property values
	   *
	   * @param {Object} object
	   * @returns {Array}
	   */
	  values: function(object) {
	    var values = [];
	    this.objectApply(object, function(value) {
	      values.push(value);
	    });
	    return values;
	  },

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
	  apply: function(array, f, context) {
	    for (var i = 0; i < array.length; i++) {
	      f.call(context || global, array[i], i, array);
	    }
	  },

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
	  map: function(array, f) {
	    var result = [];
	    for (var i = 0; i < array.length; i++) {
	      result.push(f(array[i], i, array, result));
	    }
	    return result;
	  },

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
	  mapObject: function(object, f) {
	    var result = {};
	    this.objectApply(object, function(value, key) {
	      result[key] = f(value);
	    });
	    return result;
	  },

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
	  filter: function(array, test) {
	    test = test || function(value) { return !!value; };

	    var result = [];
	    for (var i = 0; i < array.length; i++) {
	      if (test(array[i], i, array, result)) {
	        result.push(array[i]);
	      }
	    }
	    return result;
	  },

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
	  filterObject: function(object, test) {
	    var result = {};
	    this.objectApply(object, function(value, key) {
	      if ((test && test(value, key, object, result)) || Boolean(value)) {
	        result[key] = value;
	      }
	    });
	    return result;
	  },

	  /** Flattens an object into a two-dimensional array.
	   *
	   * @param  {Object} object
	   * @return {Array} resulting array of [key, value] pairs
	   */
	  flatten: function(object) {
	    var result = [];
	    this.objectApply(object, function(value, key) {
	      result.push([key, value]);
	    });
	    return result;
	  },

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
	  any: function(array, test) {
	    for (var i = 0; i < array.length; i++) {
	      if (test(array[i], i, array)) {
	        return true;
	      }
	    }
	    return false;
	  },

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
	  all: function(array, test) {
	    for (var i = 0; i < array.length; i++) {
	      if (!test(array[i], i, array)) {
	        return false;
	      }
	    }
	    return true;
	  },

	  /** Builds a function that will proxy a method call to its first argument.
	   *
	   * Allows partial application of arguments, so additional arguments are
	   * prepended to the argument list.
	   *
	   * @param  {String} name method name
	   * @return {Function} proxy function
	   */
	  method: function(name) {
	    var boundArguments = Array.prototype.slice.call(arguments, 1);
	    return function(object) {
	      return object[name].apply(object, boundArguments.concat(arguments));
	    };
	  },

	  getDocument: function() {
	    try {
	      return document || undefined;
	    } catch(e) {
	      return undefined;
	    }
	  },

	  getLocalStorage: function() {
	    try {
	      return window.localStorage;
	    } catch (e) {
	      return undefined;
	    }
	  },

	  getClientFeatures: function() {
	    var WSTransport = __webpack_require__(4).WSTransport;
	    return this.keys(
	      this.filterObject(
	        { "ws": WSTransport },
	        function (t) { return t.isSupported({}); }
	      )
	    );
	  },

	  isXHRSupported: function() {
	    return Boolean(XHR) && (new XHR()).withCredentials !== undefined;
	  },

	  isXDRSupported: function(encrypted) {
	    var protocol = encrypted ? "https:" : "http:";
	    var documentProtocol = this.getProtocol();
	    return Boolean(window.XDomainRequest) && documentProtocol === protocol;
	  },

	  getProtocol: function(){
	    if (this.getDocument() !== undefined){
	      return this.getDocument().location.protocol;
	    }
	    return "http:";
	  },

	  createXHR: function(){
	    if (XHR){
	      return new XHR();
	    } else {
	      return new ActiveXObject("Microsoft.XMLHTTP");
	    }
	  }
	};

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = XMLHttpRequest;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);

	var global = Function("return this")();

	// We need to bind clear functions this way to avoid exceptions on IE8
	function clearTimeout(timer) {
	  global.clearTimeout(timer);
	}
	function clearInterval(timer) {
	  global.clearInterval(timer);
	}

	function GenericTimer(set, clear, delay, callback) {
	  var self = this;

	  this.clear = clear;
	  this.timer = set(function() {
	    if (self.timer !== null) {
	      self.timer = callback(self.timer);
	    }
	  }, delay);
	}
	var prototype = GenericTimer.prototype;

	/** Returns whether the timer is still running.
	 *
	 * @return {Boolean}
	 */
	prototype.isRunning = function() {
	  return this.timer !== null;
	};

	/** Aborts a timer when it's running. */
	prototype.ensureAborted = function() {
	  if (this.timer) {
	    // Clear function is already bound
	    this.clear(this.timer);
	    this.timer = null;
	  }
	};

	/** Cross-browser compatible one-off timer abstraction.
	 *
	 * @param {Number} delay
	 * @param {Function} callback
	 */
	var Timer = function(delay, callback) {
	  return new GenericTimer(setTimeout, clearTimeout, delay, function(timer) {
	    callback();
	    return null;
	  });
	};
	/** Cross-browser compatible periodic timer abstraction.
	 *
	 * @param {Number} delay
	 * @param {Function} callback
	 */
	var PeriodicTimer = function(delay, callback) {
	  return new GenericTimer(setInterval, clearInterval, delay, function(timer) {
	    callback();
	    return timer;
	  });
	};

	module.exports = {
	  Timer: Timer,
	  PeriodicTimer: PeriodicTimer
	}


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var Transport = __webpack_require__(5);
	var URLSchemes = __webpack_require__(9);
	var Util = __webpack_require__(1);
	var HTTP = __webpack_require__(12);
	var WS = __webpack_require__(20);

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


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var TransportConnection = __webpack_require__(6);

	/** Provides interface for transport connection instantiation.
	 *
	 * Takes transport-specific hooks as the only argument, which allow checking
	 * for transport support and creating its connections.
	 *
	 * Supported hooks:
	 * - file - the name of the file to be fetched during initialization
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
	function Transport(hooks) {
	  this.hooks = hooks;
	}
	var prototype = Transport.prototype;

	/** Returns whether the transport is supported in the environment.
	 *
	 * @param {Object} environment the environment details (encryption, settings)
	 * @returns {Boolean} true when the transport is supported
	 */
	prototype.isSupported = function(environment) {
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
	prototype.createConnection = function(name, priority, key, options) {
	  return new TransportConnection(
	    this.hooks, name, priority, key, options
	  );
	};

	module.exports = Transport;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);
	var EventsDispatcher = __webpack_require__(7);
	var Logger = __webpack_require__(8);

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
	function TransportConnection(hooks, name, priority, key, options) {
	  EventsDispatcher.call(this);

	  this.hooks = hooks;
	  this.name = name;
	  this.priority = priority;
	  this.key = key;
	  this.options = options;

	  this.state = "new";
	  this.timeline = options.timeline;
	  this.activityTimeout = options.activityTimeout;
	  this.id = this.timeline.generateUniqueID();
	}
	var prototype = TransportConnection.prototype;
	Util.extend(prototype, EventsDispatcher.prototype);

	/** Checks whether the transport handles activity checks by itself.
	 *
	 * @return {Boolean}
	 */
	prototype.handlesActivityChecks = function() {
	  return Boolean(this.hooks.handlesActivityChecks);
	};

	/** Checks whether the transport supports the ping/pong API.
	 *
	 * @return {Boolean}
	 */
	prototype.supportsPing = function() {
	  return Boolean(this.hooks.supportsPing);
	};

	/** Initializes the transport.
	 *
	 * Fetches resources if needed and then transitions to initialized.
	 */
	prototype.initialize = function() {
	  var self = this;

	  self.timeline.info(self.buildTimelineMessage({
	    transport: self.name + (self.options.encrypted ? "s" : "")
	  }));

	  if (self.hooks.isInitialized()) {
	    self.changeState("initialized");
	  } else {
	    self.onClose();
	  }
	};

	/** Tries to establish a connection.
	 *
	 * @returns {Boolean} false if transport is in invalid state
	 */
	prototype.connect = function() {
	  var self = this;

	  if (self.socket || self.state !== "initialized") {
	    return false;
	  }

	  var url = self.hooks.urls.getInitial(self.key, self.options);
	  try {
	    self.socket = self.hooks.getSocket(url, self.options);
	  } catch (e) {
	    Util.defer(function() {
	      self.onError(e);
	      self.changeState("closed");
	    });
	    return false;
	  }

	  self.bindListeners();

	  Logger.debug("Connecting", { transport: self.name, url: url });
	  self.changeState("connecting");
	  return true;
	};

	/** Closes the connection.
	 *
	 * @return {Boolean} true if there was a connection to close
	 */
	prototype.close = function() {
	  if (this.socket) {
	    this.socket.close();
	    return true;
	  } else {
	    return false;
	  }
	};

	/** Sends data over the open connection.
	 *
	 * @param {String} data
	 * @return {Boolean} true only when in the "open" state
	 */
	prototype.send = function(data) {
	  var self = this;

	  if (self.state === "open") {
	    // Workaround for MobileSafari bug (see https://gist.github.com/2052006)
	    Util.defer(function() {
	      if (self.socket) {
	        self.socket.send(data);
	      }
	    });
	    return true;
	  } else {
	    return false;
	  }
	};

	/** Sends a ping if the connection is open and transport supports it. */
	prototype.ping = function() {
	  if (this.state === "open" && this.supportsPing()) {
	    this.socket.ping();
	  }
	};

	/** @private */
	prototype.onOpen = function() {
	  if (this.hooks.beforeOpen) {
	    this.hooks.beforeOpen(
	      this.socket, this.hooks.urls.getPath(this.key, this.options)
	    );
	  }
	  this.changeState("open");
	  this.socket.onopen = undefined;
	};

	/** @private */
	prototype.onError = function(error) {
	  this.emit("error", { type: 'WebSocketError', error: error });
	  this.timeline.error(this.buildTimelineMessage({ error: error.toString() }));
	};

	/** @private */
	prototype.onClose = function(closeEvent) {
	  if (closeEvent) {
	    this.changeState("closed", {
	      code: closeEvent.code,
	      reason: closeEvent.reason,
	      wasClean: closeEvent.wasClean
	    });
	  } else {
	    this.changeState("closed");
	  }
	  this.unbindListeners();
	  this.socket = undefined;
	};

	/** @private */
	prototype.onMessage = function(message) {
	  this.emit("message", message);
	};

	/** @private */
	prototype.onActivity = function() {
	  this.emit("activity");
	};

	/** @private */
	prototype.bindListeners = function() {
	  var self = this;

	  self.socket.onopen = function() {
	    self.onOpen();
	  };
	  self.socket.onerror = function(error) {
	    self.onError(error);
	  };
	  self.socket.onclose = function(closeEvent) {
	    self.onClose(closeEvent);
	  };
	  self.socket.onmessage = function(message) {
	    self.onMessage(message);
	  };

	  if (self.supportsPing()) {
	    self.socket.onactivity = function() { self.onActivity(); };
	  }
	};

	/** @private */
	prototype.unbindListeners = function() {
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
	prototype.changeState = function(state, params) {
	  this.state = state;
	  this.timeline.info(this.buildTimelineMessage({
	    state: state,
	    params: params
	  }));
	  this.emit(state, params);
	};

	/** @private */
	prototype.buildTimelineMessage = function(message) {
	  return Util.extend({ cid: this.id }, message);
	};

	module.exports = TransportConnection;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var Util = __webpack_require__(1);

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
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);

	module.exports = {
	  debug: function(){
	    if (!this.log) {
	      return
	    }
	    this.log(Util.stringify.apply(this, arguments));
	  },

	  warn: function(){
	    var message = Util.stringify.apply(this, arguments);
	    if (console.warn) {
	      console.warn(message);
	    } else if (console.log) {
	      console.log(message);
	    }
	    if (this.log) {
	      this.log(message);
	    }
	  }
	}


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var Defaults = __webpack_require__(10);

	function getGenericURL(baseScheme, params, path) {
	  var scheme = baseScheme + (params.encrypted ? "s" : "");
	  var host = params.encrypted ? params.hostEncrypted : params.hostUnencrypted;
	  return scheme + "://" + host + path;
	}

	function getGenericPath(key, queryString) {
	  var path = "/app/" + key;
	  var query =
	    "?protocol=" + Defaults.PROTOCOL +
	    "&client=js" +
	    "&version=" + Defaults.VERSION +
	    (queryString ? ("&" + queryString) : "");
	  return path + query;
	}

	/** URL schemes for different transport types. */
	module.exports = {
	  /** Standard WebSocket URL scheme. */
	  ws: {
	    getInitial: function(key, params) {
	      return getGenericURL("ws", params, getGenericPath(key, "flash=false"));
	    }
	  },
	  /** URL scheme for HTTP transports. Basically, WS scheme with a prefix. */
	  http: {
	    getInitial: function(key, params) {
	      var path = (params.httpPath || "/pusher") + getGenericPath(key);
	      return getGenericURL("http", params, path);
	    }
	  }
	};


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	exports.VERSION = __webpack_require__(11).version;
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

	exports.getDefaultStrategy = function(config) {
	  var wsStrategy;
	  if (config.encrypted) {
	    wsStrategy = [
	      ":best_connected_ever",
	      ":ws_loop",
	      [":delayed", 2000, [":http_loop"]]
	    ];
	  } else {
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
/* 11 */
/***/ function(module, exports) {

	module.exports = {version: "0.2.0"};

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  getStreamingSocket: __webpack_require__(13),
	  getPollingSocket: __webpack_require__(19)
	}

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var HTTPSocket = __webpack_require__(14);

	var hooks = {
	  getReceiveURL: function(url, session) {
	    return url.base + "/" + session + "/xhr_streaming" + url.queryString;
	  },
	  onHeartbeat: function(socket) {
	    socket.sendRaw("[]");
	  },
	  sendHeartbeat: function(socket) {
	    socket.sendRaw("[]");
	  },
	  onFinished: function(socket, status) {
	    socket.onClose(1006, "Connection interrupted (" + status + ")", false);
	  }
	};

	module.exports = getStreamingSocket = function(url) {
	  return new HTTPSocket(hooks, url);
	};


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);
	var getXHR = __webpack_require__(15);
	var getXDR = __webpack_require__(18);

	var CONNECTING = 0;
	var OPEN = 1;
	var CLOSED = 3;

	var autoIncrement = 1;

	function HTTPSocket(hooks, url) {
	  this.hooks = hooks;
	  this.session = randomNumber(1000) + "/" + randomString(8);
	  this.location = getLocation(url);
	  this.readyState = CONNECTING;
	  this.openStream();
	}
	var prototype = HTTPSocket.prototype;

	prototype.send = function(payload) {
	  return this.sendRaw(JSON.stringify([payload]));
	};

	prototype.ping = function() {
	  this.hooks.sendHeartbeat(this);
	};

	prototype.close = function(code, reason) {
	  this.onClose(code, reason, true);
	};

	/** For internal use only */
	prototype.sendRaw = function(payload) {
	  if (this.readyState === OPEN) {
	    try {
	      createRequest(
	        "POST", getUniqueURL(getSendURL(this.location, this.session))
	      ).start(payload);
	      return true;
	    } catch(e) {
	      return false;
	    }
	  } else {
	    return false;
	  }
	};

	/** For internal use only */
	prototype.reconnect = function() {
	  this.closeStream();
	  this.openStream();
	};

	/** For internal use only */
	prototype.onClose = function(code, reason, wasClean) {
	  this.closeStream();
	  this.readyState = CLOSED;
	  if (this.onclose) {
	    this.onclose({
	      code: code,
	      reason: reason,
	      wasClean: wasClean
	    });
	  }
	};

	/** @private */
	prototype.onChunk = function(chunk) {
	  if (chunk.status !== 200) {
	    return;
	  }
	  if (this.readyState === OPEN) {
	    this.onActivity();
	  }

	  var payload;
	  var type = chunk.data.slice(0, 1);
	  switch(type) {
	    case 'o':
	      payload = JSON.parse(chunk.data.slice(1) || '{}');
	      this.onOpen(payload);
	      break;
	    case 'a':
	      payload = JSON.parse(chunk.data.slice(1) || '[]');
	      for (var i = 0; i < payload.length; i++){
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
	prototype.onOpen = function(options) {
	  if (this.readyState === CONNECTING) {
	    if (options && options.hostname) {
	      this.location.base = replaceHost(this.location.base, options.hostname);
	    }
	    this.readyState = OPEN;

	    if (this.onopen) {
	      this.onopen();
	    }
	  } else {
	    this.onClose(1006, "Server lost session", true);
	  }
	};

	/** @private */
	prototype.onEvent = function(event) {
	  if (this.readyState === OPEN && this.onmessage) {
	    this.onmessage({ data: event });
	  }
	};

	/** @private */
	prototype.onActivity = function() {
	  if (this.onactivity) {
	    this.onactivity();
	  }
	};

	/** @private */
	prototype.onError = function(error) {
	  if (this.onerror) {
	    this.onerror(error);
	  }
	};

	/** @private */
	prototype.openStream = function() {
	  var self = this;

	  self.stream = createRequest(
	    "POST",
	    getUniqueURL(self.hooks.getReceiveURL(self.location, self.session))
	  );

	  self.stream.bind("chunk", function(chunk) {
	    self.onChunk(chunk);
	  });
	  self.stream.bind("finished", function(status) {
	    self.hooks.onFinished(self, status);
	  });
	  self.stream.bind("buffer_too_long", function() {
	    self.reconnect();
	  });

	  try {
	    self.stream.start();
	  } catch (error) {
	    Util.defer(function() {
	      self.onError(error);
	      self.onClose(1006, "Could not start streaming", false);
	    });
	  }
	};

	/** @private */
	prototype.closeStream = function() {
	  if (this.stream) {
	    this.stream.unbind_all();
	    this.stream.close();
	    this.stream = null;
	  }
	};

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
	  } else if (Util.isXDRSupported(url.indexOf("https:") === 0)) {
	    return getXDR(method, url);
	  } else {
	    throw "Cross-origin HTTP requests are not supported";
	  }
	}

	module.exports = HTTPSocket;


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var HTTPRequest = __webpack_require__(16);
	var XHR = __webpack_require__(2);

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
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var App = __webpack_require__(17);

	var EventsDispatcher = __webpack_require__(7);
	var Util = __webpack_require__(1);

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
/* 17 */
/***/ function(module, exports) {

	exports.addUnloadListener = function(listener) {
	  // there is no "unload" callback in this environment
	};

	exports.removeUnloadListener = function(listener) {
	  // there is no "unload" callback in this environment
	};


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var HTTPRequest = __webpack_require__(16);

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


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	var HTTPSocket = __webpack_require__(14);

	var hooks = {
	  getReceiveURL: function(url, session) {
	    return url.base + "/" + session + "/xhr" + url.queryString;
	  },
	  onHeartbeat: function() {
	    // next HTTP request will reset server's activity timer
	  },
	  sendHeartbeat: function(socket) {
	    socket.sendRaw("[]");
	  },
	  onFinished: function(socket, status) {
	    if (status === 200) {
	      socket.reconnect();
	    } else {
	      socket.onClose(1006, "Connection interrupted (" + status + ")", false);
	    }
	  }
	};

	module.exports = getPollingSocket = function(url) {
	  return new HTTPSocket(hooks, url);
	};


/***/ },
/* 20 */
/***/ function(module, exports) {

	module.exports = WebSocket || MozWebSocket;


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var Channel = __webpack_require__(22);
	var PresenceChannel = __webpack_require__(25);
	var PrivateChannel = __webpack_require__(26);
	var Util = __webpack_require__(1);

	/** Handles a channel map. */
	function Channels() {
	  this.channels = {};
	}
	var prototype = Channels.prototype;

	/** Creates or retrieves an existing channel by its name.
	 *
	 * @param {String} name
	 * @param {Pusher} pusher
	 * @return {Channel}
	 */
	prototype.add = function(name, pusher) {
	  if (!this.channels[name]) {
	    this.channels[name] = createChannel(name, pusher);
	  }
	  return this.channels[name];
	};

	/** Returns a list of all channels
	 *
	 * @return {Array}
	 */
	prototype.all = function(name) {
	  return Util.values(this.channels);
	};

	/** Finds a channel by its name.
	 *
	 * @param {String} name
	 * @return {Channel} channel or null if it doesn't exist
	 */
	prototype.find = function(name) {
	  return this.channels[name];
	};

	/** Removes a channel from the map.
	 *
	 * @param {String} name
	 */
	prototype.remove = function(name) {
	  var channel = this.channels[name];
	  delete this.channels[name];
	  return channel;
	};

	/** Proxies disconnection signal to all channels. */
	prototype.disconnect = function() {
	  Util.objectApply(this.channels, function(channel) {
	    channel.disconnect();
	  });
	};

	function createChannel(name, pusher) {
	  if (name.indexOf('private-') === 0) {
	    return new PrivateChannel(name, pusher);
	  } else if (name.indexOf('presence-') === 0) {
	    return new PresenceChannel(name, pusher);
	  } else {
	    return new Channel(name, pusher);
	  }
	}

	module.exports = Channels;


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var EventsDispatcher = __webpack_require__(7);
	var Util = __webpack_require__(1);
	var Errors = __webpack_require__(23);
	var Logger = __webpack_require__(8);

	/** Provides base public channel interface with an event emitter.
	 *
	 * Emits:
	 * - pusher:subscription_succeeded - after subscribing successfully
	 * - other non-internal events
	 *
	 * @param {String} name
	 * @param {Pusher} pusher
	 */
	function Channel(name, pusher) {
	  EventsDispatcher.call(this, function(event, data) {
	    Logger.debug('No callbacks on ' + name + ' for ' + event);
	  });

	  this.name = name;
	  this.pusher = pusher;
	  this.subscribed = false;
	}
	var prototype = Channel.prototype;
	Util.extend(prototype, EventsDispatcher.prototype);

	/** Skips authorization, since public channels don't require it.
	 *
	 * @param {Function} callback
	 */
	prototype.authorize = function(socketId, callback) {
	  return callback(false, {});
	};

	/** Triggers an event */
	prototype.trigger = function(event, data) {
	  if (event.indexOf("client-") !== 0) {
	    throw new Errors.BadEventName(
	      "Event '" + event + "' does not start with 'client-'"
	    );
	  }
	  return this.pusher.send_event(event, data, this.name);
	};

	/** Signals disconnection to the channel. For internal use only. */
	prototype.disconnect = function() {
	  this.subscribed = false;
	};

	/** Handles an event. For internal use only.
	 *
	 * @param {String} event
	 * @param {*} data
	 */
	prototype.handleEvent = function(event, data) {
	  if (event.indexOf("pusher_internal:") === 0) {
	    if (event === "pusher_internal:subscription_succeeded") {
	      this.subscribed = true;
	      this.emit("pusher:subscription_succeeded", data);
	    }
	  } else {
	    this.emit(event, data);
	  }
	};

	/** Sends a subscription request. For internal use only. */
	prototype.subscribe = function() {
	  var self = this;

	  self.authorize(self.pusher.connection.socket_id, function(error, data) {
	    if (error) {
	      self.handleEvent('pusher:subscription_error', data);
	    } else {
	      self.pusher.send_event('pusher:subscribe', {
	        auth: data.auth,
	        channel_data: data.channel_data,
	        channel: self.name
	      });
	    }
	  });
	};

	/** Sends an unsubscription request. For internal use only. */
	prototype.unsubscribe = function() {
	  this.pusher.send_event('pusher:unsubscribe', {
	    channel: this.name
	  });
	};

	Channel.Authorizer = __webpack_require__(24);

	module.exports = Channel;


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);

	function buildExceptionClass(name) {
	  var constructor = function(message) {
	    Error.call(this, message);
	    this.name = name;
	  };
	  Util.extend(constructor.prototype, Error.prototype);

	  return constructor;
	}

	/** Error classes used throughout the library. */
	module.exports = {
	  BadEventName: buildExceptionClass("BadEventName"),
	  RequestTimedOut: buildExceptionClass("RequestTimedOut"),
	  TransportPriorityTooLow: buildExceptionClass("TransportPriorityTooLow"),
	  TransportClosed: buildExceptionClass("TransportClosed"),
	  UnsupportedTransport: buildExceptionClass("UnsupportedTransport"),
	  UnsupportedStrategy: buildExceptionClass("UnsupportedStrategy")
	};


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var Logger = __webpack_require__(8);
	var Util = __webpack_require__(1);

	var Authorizer = function(channel, options) {
	  this.channel = channel;
	  this.type = options.authTransport;

	  this.options = options;
	  this.authOptions = (options || {}).auth || {};
	};

	Authorizer.prototype = {
	  composeQuery: function(socketId) {
	    var query = 'socket_id=' + encodeURIComponent(socketId) +
	      '&channel_name=' + encodeURIComponent(this.channel.name);

	    for(var i in this.authOptions.params) {
	      query += "&" + encodeURIComponent(i) + "=" + encodeURIComponent(this.authOptions.params[i]);
	    }

	    return query;
	  },

	  authorize: function(socketId, callback) {
	    return authorizers[this.type].call(this, socketId, callback);
	  }
	};

	var nextAuthCallbackID = 1;

	var authorizers = {
	  ajax: function(socketId, callback){
	    var self = this, xhr;

	    xhr = Util.createXHR();

	    xhr.open("POST", self.options.authEndpoint, true);

	    // add request headers
	    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	    for(var headerName in this.authOptions.headers) {
	      xhr.setRequestHeader(headerName, this.authOptions.headers[headerName]);
	    }

	    xhr.onreadystatechange = function() {
	      if (xhr.readyState === 4) {
	        if (xhr.status === 200) {
	          var data, parsed = false;

	          try {
	            data = JSON.parse(xhr.responseText);
	            parsed = true;
	          } catch (e) {
	            callback(true, 'JSON returned from webapp was invalid, yet status code was 200. Data was: ' + xhr.responseText);
	          }

	          if (parsed) { // prevents double execution.
	            callback(false, data);
	          }
	        } else {
	          Logger.warn("Couldn't get auth info from your webapp", xhr.status);
	          callback(true, xhr.status);
	        }
	      }
	    };

	    xhr.send(this.composeQuery(socketId));
	    return xhr;
	  }
	};

	module.exports = Authorizer;


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);
	var PrivateChannel = __webpack_require__(26);
	var Members = __webpack_require__(27);
	var Logger = __webpack_require__(8);

	/** Adds presence channel functionality to private channels.
	 *
	 * @param {String} name
	 * @param {Pusher} pusher
	 */
	function PresenceChannel(name, pusher) {
	  PrivateChannel.call(this, name, pusher);
	  this.members = new Members();
	}
	var prototype = PresenceChannel.prototype;
	Util.extend(prototype, PrivateChannel.prototype);

	/** Authenticates the connection as a member of the channel.
	 *
	 * @param  {String} socketId
	 * @param  {Function} callback
	 */
	prototype.authorize = function(socketId, callback) {
	  var _super = PrivateChannel.prototype.authorize;
	  var self = this;
	  _super.call(self, socketId, function(error, authData) {
	    if (!error) {
	      if (authData.channel_data === undefined) {
	        Logger.warn(
	          "Invalid auth response for channel '" +
	          self.name +
	          "', expected 'channel_data' field"
	        );
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
	prototype.handleEvent = function(event, data) {
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
	      PrivateChannel.prototype.handleEvent.call(this, event, data);
	  }
	};

	/** Resets the channel state, including members map. For internal use only. */
	prototype.disconnect = function() {
	  this.members.reset();
	  PrivateChannel.prototype.disconnect.call(this);
	};

	module.exports = PresenceChannel;


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	var Channel = __webpack_require__(22);
	var Util = __webpack_require__(1);

	/** Extends public channels to provide private channel interface.
	 *
	 * @param {String} name
	 * @param {Pusher} pusher
	 */
	function PrivateChannel(name, pusher) {
	  Channel.call(this, name, pusher);
	}
	var prototype = PrivateChannel.prototype;
	Util.extend(prototype, Channel.prototype);

	/** Authorizes the connection to use the channel.
	 *
	 * @param  {String} socketId
	 * @param  {Function} callback
	 */
	prototype.authorize = function(socketId, callback) {
	  var authorizer = new Channel.Authorizer(this, this.pusher.config);
	  return authorizer.authorize(socketId, callback);
	};

	module.exports = PrivateChannel;


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);

	/** Represents a collection of members of a presence channel. */
	function Members() {
	  this.reset();
	}
	var prototype = Members.prototype;

	/** Returns member's info for given id.
	 *
	 * Resulting object containts two fields - id and info.
	 *
	 * @param {Number} id
	 * @return {Object} member's info or null
	 */
	prototype.get = function(id) {
	  if (Object.prototype.hasOwnProperty.call(this.members, id)) {
	    return {
	      id: id,
	      info: this.members[id]
	    };
	  } else {
	    return null;
	  }
	};

	/** Calls back for each member in unspecified order.
	 *
	 * @param  {Function} callback
	 */
	prototype.each = function(callback) {
	  var self = this;
	  Util.objectApply(self.members, function(member, id) {
	    callback(self.get(id));
	  });
	};

	/** Updates the id for connected member. For internal use only. */
	prototype.setMyID = function(id) {
	  this.myID = id;
	};

	/** Handles subscription data. For internal use only. */
	prototype.onSubscription = function(subscriptionData) {
	  this.members = subscriptionData.presence.hash;
	  this.count = subscriptionData.presence.count;
	  this.me = this.get(this.myID);
	};

	/** Adds a new member to the collection. For internal use only. */
	prototype.addMember = function(memberData) {
	  if (this.get(memberData.user_id) === null) {
	    this.count++;
	  }
	  this.members[memberData.user_id] = memberData.user_info;
	  return this.get(memberData.user_id);
	};

	/** Adds a member from the collection. For internal use only. */
	prototype.removeMember = function(memberData) {
	  var member = this.get(memberData.user_id);
	  if (member) {
	    delete this.members[memberData.user_id];
	    this.count--;
	  }
	  return member;
	};

	/** Resets the collection to the initial state. For internal use only. */
	prototype.reset = function() {
	  this.members = {};
	  this.count = 0;
	  this.myID = null;
	  this.me = null;
	};

	module.exports = Members;


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);

	function Timeline(key, session, options) {
	  this.key = key;
	  this.session = session;
	  this.events = [];
	  this.options = options || {};
	  this.sent = 0;
	  this.uniqueID = 0;
	}
	var prototype = Timeline.prototype;

	// Log levels
	Timeline.ERROR = 3;
	Timeline.INFO = 6;
	Timeline.DEBUG = 7;

	prototype.log = function(level, event) {
	  if (level <= this.options.level) {
	    this.events.push(
	      Util.extend({}, event, { timestamp: Util.now() })
	    );
	    if (this.options.limit && this.events.length > this.options.limit) {
	      this.events.shift();
	    }
	  }
	};

	prototype.error = function(event) {
	  this.log(Timeline.ERROR, event);
	};

	prototype.info = function(event) {
	  this.log(Timeline.INFO, event);
	};

	prototype.debug = function(event) {
	  this.log(Timeline.DEBUG, event);
	};

	prototype.isEmpty = function() {
	  return this.events.length === 0;
	};

	prototype.send = function(sendXHR, callback) {
	  var self = this;

	  var data = Util.extend({
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
	  sendXHR(data, function(error, result) {
	    if (!error) {
	      self.sent++;
	    }
	    if (callback) {
	      callback(error, result);
	    }
	  });

	  return true;
	};

	prototype.generateUniqueID = function() {
	  this.uniqueID++;
	  return this.uniqueID;
	};

	module.exports = Timeline;


/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);
	var Base64 = __webpack_require__(30);

	function TimelineSender(timeline, options) {
	  this.timeline = timeline;
	  this.options = options || {};
	}
	var prototype = TimelineSender.prototype;

	prototype.send = function(encrypted, callback) {
	  var self = this;

	  if (self.timeline.isEmpty()) {
	    return;
	  }

	  var sendXHR = function(data, callback) {
	    var scheme = "http" + (encrypted ? "s" : "") + "://";
	    var url = scheme + (self.host || self.options.host) + self.options.path;
	    var params = Util.filterObject(data, function(value) {
	      return value !== undefined;
	    });

	    var query = Util.map(
	      Util.flatten(encodeParamsObject(params)),
	      Util.method("join", "=")
	    ).join("&");

	    url += ("/" + 2 + "?" + query); // TODO: check what to do in lieu of receiver number

	    var xhr = Util.createXHR();
	    xhr.open("GET", url, true);

	    xhr.onreadystatechange = function(){
	      if (xhr.readyState === 4) {
	        // TODO: handle response
	      }
	    }

	    xhr.send()
	  };
	  self.timeline.send(sendXHR, callback);
	};

	function encodeParamsObject(data) {
	  return Util.mapObject(data, function(value) {
	    if (typeof value === "object") {
	      value = JSON.stringify(value);
	    }
	    return encodeURIComponent(Base64.encode(value.toString()));
	  });
	}

	module.exports = TimelineSender;


/***/ },
/* 30 */
/***/ function(module, exports) {

	var global = Function("return this")();

	var Base64 = {
	  encode: function (s) {
	    return btoa(utob(s));
	  }
	};

	var fromCharCode = String.fromCharCode;

	var b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	var b64tab = {};

	for (var i = 0, l = b64chars.length; i < l; i++) {
	  b64tab[b64chars.charAt(i)] = i;
	}

	var cb_utob = function(c) {
	  var cc = c.charCodeAt(0);
	  return cc < 0x80 ? c
	      : cc < 0x800 ? fromCharCode(0xc0 | (cc >>> 6)) +
	                     fromCharCode(0x80 | (cc & 0x3f))
	      : fromCharCode(0xe0 | ((cc >>> 12) & 0x0f)) +
	        fromCharCode(0x80 | ((cc >>>  6) & 0x3f)) +
	        fromCharCode(0x80 | ( cc         & 0x3f));
	};

	var utob = function(u) {
	  return u.replace(/[^\x00-\x7F]/g, cb_utob);
	};

	var cb_encode = function(ccc) {
	  var padlen = [0, 2, 1][ccc.length % 3];
	  var ord = ccc.charCodeAt(0) << 16
	    | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
	    | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0));
	  var chars = [
	    b64chars.charAt( ord >>> 18),
	    b64chars.charAt((ord >>> 12) & 63),
	    padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
	    padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
	  ];
	  return chars.join('');
	};

	var btoa;

	if (global && global.btoa){
	  btoa = global.btoa;
	} else {
	  btoa = function(b) {
	    return b.replace(/[\s\S]{1,3}/g, cb_encode);
	  };
	}

	module.exports = Base64;


/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);
	var Transports = __webpack_require__(4);
	var TransportManager = __webpack_require__(32);
	var Errors = __webpack_require__(23);
	var TransportStrategy = __webpack_require__(34);
	var SequentialStrategy = __webpack_require__(38);
	var BestConnectedEverStrategy = __webpack_require__(39);
	var CachedStrategy = __webpack_require__(40);
	var DelayedStrategy = __webpack_require__(41);
	var IfStrategy = __webpack_require__(42);
	var FirstConnectedStrategy = __webpack_require__(43);

	module.exports = StrategyBuilder = {
	  /** Transforms a JSON scheme to a strategy tree.
	   *
	   * @param {Array} scheme JSON strategy scheme
	   * @param {Object} options a hash of symbols to be included in the scheme
	   * @returns {Strategy} strategy tree that's represented by the scheme
	   */
	  build: function(scheme, options) {
	    var context = Util.extend({}, globalContext, options);
	    return evaluate(scheme, context)[1].strategy;
	  }
	};

	var transports = {
	  ws: Transports.WSTransport,
	  xhr_streaming: Transports.XHRStreamingTransport,
	  xdr_streaming: Transports.XDRStreamingTransport,
	  xhr_polling: Transports.XHRPollingTransport,
	  xdr_polling: Transports.XDRPollingTransport
	};

	var UnsupportedStrategy = {
	  isSupported: function() {
	    return false;
	  },
	  connect: function(_, callback) {
	    var deferred = Util.defer(function() {
	      callback(new Errors.UnsupportedStrategy());
	    });
	    return {
	      abort: function() {
	        deferred.ensureAborted();
	      },
	      forceMinPriority: function() {}
	    };
	  }
	};

	// DSL bindings

	function returnWithOriginalContext(f) {
	  return function(context) {
	    return [f.apply(this, arguments), context];
	  };
	}

	var globalContext = {
	  extend: function(context, first, second) {
	    return [Util.extend({}, first, second), context];
	  },

	  def: function(context, name, value) {
	    if (context[name] !== undefined) {
	      throw "Redefining symbol " + name;
	    }
	    context[name] = value;
	    return [undefined, context];
	  },

	  def_transport: function(context, name, type, priority, options, manager) {
	    var transportClass = transports[type];
	    if (!transportClass) {
	      throw new Errors.UnsupportedTransport(type);
	    }

	    var enabled =
	      (!context.enabledTransports ||
	        Util.arrayIndexOf(context.enabledTransports, name) !== -1) &&
	      (!context.disabledTransports ||
	        Util.arrayIndexOf(context.disabledTransports, name) === -1);

	    var transport;
	    if (enabled) {
	      transport = new TransportStrategy(
	        name,
	        priority,
	        manager ? manager.getAssistant(transportClass) : transportClass,
	        Util.extend({
	          key: context.key,
	          encrypted: context.encrypted,
	          timeline: context.timeline,
	          ignoreNullOrigin: context.ignoreNullOrigin
	        }, options)
	      );
	    } else {
	      transport = UnsupportedStrategy;
	    }

	    var newContext = context.def(context, name, transport)[1];
	    newContext.transports = context.transports || {};
	    newContext.transports[name] = transport;
	    return [undefined, newContext];
	  },

	  transport_manager: returnWithOriginalContext(function(_, options) {
	    return new TransportManager(options);
	  }),

	  sequential: returnWithOriginalContext(function(_, options) {
	    var strategies = Array.prototype.slice.call(arguments, 2);
	    return new SequentialStrategy(strategies, options);
	  }),

	  cached: returnWithOriginalContext(function(context, ttl, strategy){
	    return new CachedStrategy(strategy, context.transports, {
	      ttl: ttl,
	      timeline: context.timeline,
	      encrypted: context.encrypted
	    });
	  }),

	  first_connected: returnWithOriginalContext(function(_, strategy) {
	    return new FirstConnectedStrategy(strategy);
	  }),

	  best_connected_ever: returnWithOriginalContext(function() {
	    var strategies = Array.prototype.slice.call(arguments, 1);
	    return new BestConnectedEverStrategy(strategies);
	  }),

	  delayed: returnWithOriginalContext(function(_, delay, strategy) {
	    return new DelayedStrategy(strategy, { delay: delay });
	  }),

	  "if": returnWithOriginalContext(function(_, test, trueBranch, falseBranch) {
	    return new IfStrategy(test, trueBranch, falseBranch);
	  }),

	  is_supported: returnWithOriginalContext(function(_, strategy) {
	    return function() {
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
	      var args = [Util.extend({}, context)].concat(
	        Util.map(expression.slice(1), function(arg) {
	          return evaluate(arg, Util.extend({}, context))[0];
	        })
	      );
	      return f.apply(this, args);
	    } else {
	      return [f, context];
	    }
	  } else {
	    return evaluateListOfExpressions(expression, context);
	  }
	}

	function evaluate(expression, context) {
	  var expressionType = typeof expression;
	  if (typeof expression === "string") {
	    return evaluateString(expression, context);
	  } else if (typeof expression === "object") {
	    if (expression instanceof Array && expression.length > 0) {
	      return evaluateArray(expression, context);
	    }
	  }
	  return [expression, context];
	}


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	var AssistantToTheTransportManager = __webpack_require__(33);

	/** Keeps track of the number of lives left for a transport.
	 *
	 * In the beginning of a session, transports may be assigned a number of
	 * lives. When an AssistantToTheTransportManager instance reports a transport
	 * connection closed uncleanly, the transport loses a life. When the number
	 * of lives drops to zero, the transport gets disabled by its manager.
	 *
	 * @param {Object} options
	 */
	function TransportManager(options) {
	  this.options = options || {};
	  this.livesLeft = this.options.lives || Infinity;
	}
	var prototype = TransportManager.prototype;

	/** Creates a assistant for the transport.
	 *
	 * @param {Transport} transport
	 * @returns {AssistantToTheTransportManager}
	 */
	prototype.getAssistant = function(transport) {
	  return new AssistantToTheTransportManager(this, transport, {
	    minPingDelay: this.options.minPingDelay,
	    maxPingDelay: this.options.maxPingDelay
	  });
	};

	/** Returns whether the transport has any lives left.
	 *
	 * @returns {Boolean}
	 */
	prototype.isAlive = function() {
	  return this.livesLeft > 0;
	};

	/** Takes one life from the transport. */
	prototype.reportDeath = function() {
	  this.livesLeft -= 1;
	};

	module.exports = TransportManager;


/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);

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
	function AssistantToTheTransportManager(manager, transport, options) {
	  this.manager = manager;
	  this.transport = transport;
	  this.minPingDelay = options.minPingDelay;
	  this.maxPingDelay = options.maxPingDelay;
	  this.pingDelay = undefined;
	}
	var prototype = AssistantToTheTransportManager.prototype;

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
	prototype.createConnection = function(name, priority, key, options) {
	  var self = this;

	  options = Util.extend({}, options, {
	    activityTimeout: self.pingDelay
	  });
	  var connection = self.transport.createConnection(
	    name, priority, key, options
	  );

	  var openTimestamp = null;

	  var onOpen = function() {
	    connection.unbind("open", onOpen);
	    connection.bind("closed", onClosed);
	    openTimestamp = Util.now();
	  };
	  var onClosed = function(closeEvent) {
	    connection.unbind("closed", onClosed);

	    if (closeEvent.code === 1002 || closeEvent.code === 1003) {
	      // we don't want to use transports not obeying the protocol
	      self.manager.reportDeath();
	    } else if (!closeEvent.wasClean && openTimestamp) {
	      // report deaths only for short-living transport
	      var lifespan = Util.now() - openTimestamp;
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
	prototype.isSupported = function(environment) {
	  return this.manager.isAlive() && this.transport.isSupported(environment);
	};

	module.exports = AssistantToTheTransportManager;


/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);
	var Errors = __webpack_require__(23);
	var Handshake = __webpack_require__(35);

	/** Provides a strategy interface for transports.
	 *
	 * @param {String} name
	 * @param {Number} priority
	 * @param {Class} transport
	 * @param {Object} options
	 */
	function TransportStrategy(name, priority, transport, options) {
	  this.name = name;
	  this.priority = priority;
	  this.transport = transport;
	  this.options = options || {};
	}
	var prototype = TransportStrategy.prototype;

	/** Returns whether the transport is supported in the browser.
	 *
	 * @returns {Boolean}
	 */
	prototype.isSupported = function() {
	  return this.transport.isSupported({
	    encrypted: this.options.encrypted
	  });
	};

	/** Launches a connection attempt and returns a strategy runner.
	 *
	 * @param  {Function} callback
	 * @return {Object} strategy runner
	 */
	prototype.connect = function(minPriority, callback) {
	  if (!this.isSupported()) {
	    return failAttempt(new Errors.UnsupportedStrategy(), callback);
	  } else if (this.priority < minPriority) {
	    return failAttempt(new Errors.TransportPriorityTooLow(), callback);
	  }

	  var self = this;
	  var connected = false;

	  var transport = this.transport.createConnection(
	    this.name, this.priority, this.options.key, this.options
	  );
	  var handshake = null;

	  var onInitialized = function() {
	    transport.unbind("initialized", onInitialized);
	    transport.connect();
	  };
	  var onOpen = function() {
	    handshake = new Handshake(transport, function(result) {
	      connected = true;
	      unbindListeners();
	      callback(null, result);
	    });
	  };
	  var onError = function(error) {
	    unbindListeners();
	    callback(error);
	  };
	  var onClosed = function() {
	    unbindListeners();
	    callback(new Errors.TransportClosed(transport));
	  };

	  var unbindListeners = function() {
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
	    abort: function() {
	      if (connected) {
	        return;
	      }
	      unbindListeners();
	      if (handshake) {
	        handshake.close();
	      } else {
	        transport.close();
	      }
	    },
	    forceMinPriority: function(p) {
	      if (connected) {
	        return;
	      }
	      if (self.priority < p) {
	        if (handshake) {
	          handshake.close();
	        } else {
	          transport.close();
	        }
	      }
	    }
	  };
	};

	function failAttempt(error, callback) {
	  Util.defer(function() {
	    callback(error);
	  });
	  return {
	    abort: function() {},
	    forceMinPriority: function() {}
	  };
	}

	module.exports = TransportStrategy;


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);
	var Protocol = __webpack_require__(36);
	var Connection = __webpack_require__(37);

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
	function Handshake(transport, callback) {
	  this.transport = transport;
	  this.callback = callback;
	  this.bindListeners();
	}
	var prototype = Handshake.prototype;

	prototype.close = function() {
	  this.unbindListeners();
	  this.transport.close();
	};

	/** @private */
	prototype.bindListeners = function() {
	  var self = this;

	  self.onMessage = function(m) {
	    self.unbindListeners();

	    try {
	      var result = Protocol.processHandshake(m);
	      if (result.action === "connected") {
	        self.finish("connected", {
	          connection: new Connection(result.id, self.transport),
	          activityTimeout: result.activityTimeout
	        });
	      } else {
	        self.finish(result.action, { error: result.error });
	        self.transport.close();
	      }
	    } catch (e) {
	      self.finish("error", { error: e });
	      self.transport.close();
	    }
	  };

	  self.onClosed = function(closeEvent) {
	    self.unbindListeners();

	    var action = Protocol.getCloseAction(closeEvent) || "backoff";
	    var error = Protocol.getCloseError(closeEvent);
	    self.finish(action, { error: error });
	  };

	  self.transport.bind("message", self.onMessage);
	  self.transport.bind("closed", self.onClosed);
	};

	/** @private */
	prototype.unbindListeners = function() {
	  this.transport.unbind("message", this.onMessage);
	  this.transport.unbind("closed", this.onClosed);
	};

	/** @private */
	prototype.finish = function(action, params) {
	  this.callback(
	    Util.extend({ transport: this.transport, action: action }, params)
	  );
	};

	module.exports = Handshake;


/***/ },
/* 36 */
/***/ function(module, exports) {

	/**
	 * Provides functions for handling Pusher protocol-specific messages.
	 */
	var Protocol = {};

	/**
	 * Decodes a message in a Pusher format.
	 *
	 * Throws errors when messages are not parse'able.
	 *
	 * @param  {Object} message
	 * @return {Object}
	 */
	Protocol.decodeMessage = function(message) {
	  try {
	    var params = JSON.parse(message.data);
	    if (typeof params.data === 'string') {
	      try {
	        params.data = JSON.parse(params.data);
	      } catch (e) {
	        if (!(e instanceof SyntaxError)) {
	          // TODO looks like unreachable code
	          // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/JSON/parse
	          throw e;
	        }
	      }
	    }
	    return params;
	  } catch (e) {
	    throw { type: 'MessageParseError', error: e, data: message.data};
	  }
	};

	/**
	 * Encodes a message to be sent.
	 *
	 * @param  {Object} message
	 * @return {String}
	 */
	Protocol.encodeMessage = function(message) {
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
	Protocol.processHandshake = function(message) {
	  message = this.decodeMessage(message);

	  if (message.event === "pusher:connection_established") {
	    if (!message.data.activity_timeout) {
	      throw "No activity timeout specified in handshake";
	    }
	    return {
	      action: "connected",
	      id: message.data.socket_id,
	      activityTimeout: message.data.activity_timeout * 1000
	    };
	  } else if (message.event === "pusher:error") {
	    // From protocol 6 close codes are sent only once, so this only
	    // happens when connection does not support close codes
	    return {
	      action: this.getCloseAction(message.data),
	      error: this.getCloseError(message.data)
	    };
	  } else {
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
	Protocol.getCloseAction = function(closeEvent) {
	  if (closeEvent.code < 4000) {
	    // ignore 1000 CLOSE_NORMAL, 1001 CLOSE_GOING_AWAY,
	    //        1005 CLOSE_NO_STATUS, 1006 CLOSE_ABNORMAL
	    // ignore 1007...3999
	    // handle 1002 CLOSE_PROTOCOL_ERROR, 1003 CLOSE_UNSUPPORTED,
	    //        1004 CLOSE_TOO_LARGE
	    if (closeEvent.code >= 1002 && closeEvent.code <= 1004) {
	      return "backoff";
	    } else {
	      return null;
	    }
	  } else if (closeEvent.code === 4000) {
	    return "ssl_only";
	  } else if (closeEvent.code < 4100) {
	    return "refused";
	  } else if (closeEvent.code < 4200) {
	    return "backoff";
	  } else if (closeEvent.code < 4300) {
	    return "retry";
	  } else {
	    // unknown error
	    return "refused";
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
	Protocol.getCloseError = function(closeEvent) {
	  if (closeEvent.code !== 1000 && closeEvent.code !== 1001) {
	    return {
	      type: 'PusherError',
	      data: {
	        code: closeEvent.code,
	        message: closeEvent.reason || closeEvent.message
	      }
	    };
	  } else {
	    return null;
	  }
	};

	module.exports = Protocol;


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);
	var EventsDispatcher = __webpack_require__(7);
	var Protocol = __webpack_require__(36);
	var Logger = __webpack_require__(8);

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
	function Connection(id, transport) {
	  EventsDispatcher.call(this);

	  this.id = id;
	  this.transport = transport;
	  this.activityTimeout = transport.activityTimeout;
	  this.bindListeners();
	}
	var prototype = Connection.prototype;
	Util.extend(prototype, EventsDispatcher.prototype);

	/** Returns whether used transport handles activity checks by itself
	 *
	 * @returns {Boolean} true if activity checks are handled by the transport
	 */
	prototype.handlesActivityChecks = function() {
	  return this.transport.handlesActivityChecks();
	};

	/** Sends raw data.
	 *
	 * @param {String} data
	 */
	prototype.send = function(data) {
	  return this.transport.send(data);
	};

	/** Sends an event.
	 *
	 * @param {String} name
	 * @param {String} data
	 * @param {String} [channel]
	 * @returns {Boolean} whether message was sent or not
	 */
	prototype.send_event = function(name, data, channel) {
	  var message = { event: name, data: data };
	  if (channel) {
	    message.channel = channel;
	  }
	  Logger.debug('Event sent', message);
	  return this.send(Protocol.encodeMessage(message));
	};

	/** Sends a ping message to the server.
	 *
	 * Basing on the underlying transport, it might send either transport's
	 * protocol-specific ping or pusher:ping event.
	 */
	prototype.ping = function() {
	  if (this.transport.supportsPing()) {
	    this.transport.ping();
	  } else {
	    this.send_event('pusher:ping', {});
	  }
	};

	/** Closes the connection. */
	prototype.close = function() {
	  this.transport.close();
	};

	/** @private */
	prototype.bindListeners = function() {
	  var self = this;

	  var listeners = {
	    message: function(m) {
	      var message;
	      try {
	        message = Protocol.decodeMessage(m);
	      } catch(e) {
	        self.emit('error', {
	          type: 'MessageParseError',
	          error: e,
	          data: m.data
	        });
	      }

	      if (message !== undefined) {
	        Logger.debug('Event recd', message);

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
	    activity: function() {
	      self.emit("activity");
	    },
	    error: function(error) {
	      self.emit("error", { type: "WebSocketError", error: error });
	    },
	    closed: function(closeEvent) {
	      unbindListeners();

	      if (closeEvent && closeEvent.code) {
	        self.handleCloseEvent(closeEvent);
	      }

	      self.transport = null;
	      self.emit("closed");
	    }
	  };

	  var unbindListeners = function() {
	    Util.objectApply(listeners, function(listener, event) {
	      self.transport.unbind(event, listener);
	    });
	  };

	  Util.objectApply(listeners, function(listener, event) {
	    self.transport.bind(event, listener);
	  });
	};

	/** @private */
	prototype.handleCloseEvent = function(closeEvent) {
	  var action = Protocol.getCloseAction(closeEvent);
	  var error = Protocol.getCloseError(closeEvent);
	  if (error) {
	    this.emit('error', error);
	  }
	  if (action) {
	    this.emit(action);
	  }
	};

	module.exports = Connection;


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);
	var Timer = __webpack_require__(3).Timer;

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
	function SequentialStrategy(strategies, options) {
	  this.strategies = strategies;
	  this.loop = Boolean(options.loop);
	  this.failFast = Boolean(options.failFast);
	  this.timeout = options.timeout;
	  this.timeoutLimit = options.timeoutLimit;
	}
	var prototype = SequentialStrategy.prototype;

	prototype.isSupported = function() {
	  return Util.any(this.strategies, Util.method("isSupported"));
	};

	prototype.connect = function(minPriority, callback) {
	  var self = this;

	  var strategies = this.strategies;
	  var current = 0;
	  var timeout = this.timeout;
	  var runner = null;

	  var tryNextStrategy = function(error, handshake) {
	    if (handshake) {
	      callback(null, handshake);
	    } else {
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
	        runner = self.tryStrategy(
	          strategies[current],
	          minPriority,
	          { timeout: timeout, failFast: self.failFast },
	          tryNextStrategy
	        );
	      } else {
	        callback(true);
	      }
	    }
	  };

	  runner = this.tryStrategy(
	    strategies[current],
	    minPriority,
	    { timeout: timeout, failFast: this.failFast },
	    tryNextStrategy
	  );

	  return {
	    abort: function() {
	      runner.abort();
	    },
	    forceMinPriority: function(p) {
	      minPriority = p;
	      if (runner) {
	        runner.forceMinPriority(p);
	      }
	    }
	  };
	};

	/** @private */
	prototype.tryStrategy = function(strategy, minPriority, options, callback) {
	  var timer = null;
	  var runner = null;

	  if (options.timeout > 0) {
	    timer = new Timer(options.timeout, function() {
	      runner.abort();
	      callback(true);
	    });
	  }

	  runner = strategy.connect(minPriority, function(error, handshake) {
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
	    abort: function() {
	      if (timer) {
	        timer.ensureAborted();
	      }
	      runner.abort();
	    },
	    forceMinPriority: function(p) {
	      runner.forceMinPriority(p);
	    }
	  };
	};

	module.exports = SequentialStrategy;


/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);

	/** Launches all substrategies and emits prioritized connected transports.
	 *
	 * @param {Array} strategies
	 */
	function BestConnectedEverStrategy(strategies) {
	  this.strategies = strategies;
	}
	var prototype = BestConnectedEverStrategy.prototype;

	prototype.isSupported = function() {
	  return Util.any(this.strategies, Util.method("isSupported"));
	};

	prototype.connect = function(minPriority, callback) {
	  return connect(this.strategies, minPriority, function(i, runners) {
	    return function(error, handshake) {
	      runners[i].error = error;
	      if (error) {
	        if (allRunnersFailed(runners)) {
	          callback(true);
	        }
	        return;
	      }
	      Util.apply(runners, function(runner) {
	        runner.forceMinPriority(handshake.transport.priority);
	      });
	      callback(null, handshake);
	    };
	  });
	};

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
	  var runners = Util.map(strategies, function(strategy, i, _, rs) {
	    return strategy.connect(minPriority, callbackBuilder(i, rs));
	  });
	  return {
	    abort: function() {
	      Util.apply(runners, abortRunner);
	    },
	    forceMinPriority: function(p) {
	      Util.apply(runners, function(runner) {
	        runner.forceMinPriority(p);
	      });
	    }
	  };
	}

	function allRunnersFailed(runners) {
	  return Util.all(runners, function(runner) {
	    return Boolean(runner.error);
	  });
	}

	function abortRunner(runner) {
	  if (!runner.error && !runner.aborted) {
	    runner.abort();
	    runner.aborted = true;
	  }
	}

	module.exports = BestConnectedEverStrategy;


/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);
	var SequentialStrategy = __webpack_require__(38);

	/** Caches last successful transport and uses it for following attempts.
	 *
	 * @param {Strategy} strategy
	 * @param {Object} transports
	 * @param {Object} options
	 */
	function CachedStrategy(strategy, transports, options) {
	  this.strategy = strategy;
	  this.transports = transports;
	  this.ttl = options.ttl || 1800*1000;
	  this.encrypted = options.encrypted;
	  this.timeline = options.timeline;
	}
	var prototype = CachedStrategy.prototype;

	prototype.isSupported = function() {
	  return this.strategy.isSupported();
	};

	prototype.connect = function(minPriority, callback) {
	  var encrypted = this.encrypted;
	  var info = fetchTransportCache(encrypted);

	  var strategies = [this.strategy];
	  if (info && info.timestamp + this.ttl >= Util.now()) {
	    var transport = this.transports[info.transport];
	    if (transport) {
	      this.timeline.info({
	        cached: true,
	        transport: info.transport,
	        latency: info.latency
	      });
	      strategies.push(new SequentialStrategy([transport], {
	        timeout: info.latency * 2 + 1000,
	        failFast: true
	      }));
	    }
	  }

	  var startTimestamp = Util.now();
	  var runner = strategies.pop().connect(
	    minPriority,
	    function cb(error, handshake) {
	      if (error) {
	        flushTransportCache(encrypted);
	        if (strategies.length > 0) {
	          startTimestamp = Util.now();
	          runner = strategies.pop().connect(minPriority, cb);
	        } else {
	          callback(error);
	        }
	      } else {
	        storeTransportCache(
	          encrypted,
	          handshake.transport.name,
	          Util.now() - startTimestamp
	        );
	        callback(null, handshake);
	      }
	    }
	  );

	  return {
	    abort: function() {
	      runner.abort();
	    },
	    forceMinPriority: function(p) {
	      minPriority = p;
	      if (runner) {
	        runner.forceMinPriority(p);
	      }
	    }
	  };
	};

	function getTransportCacheKey(encrypted) {
	  return "pusherTransport" + (encrypted ? "Encrypted" : "Unencrypted");
	}

	function fetchTransportCache(encrypted) {
	  var storage = Util.getLocalStorage();
	  if (storage) {
	    try {
	      var serializedCache = storage[getTransportCacheKey(encrypted)];
	      if (serializedCache) {
	        return JSON.parse(serializedCache);
	      }
	    } catch (e) {
	      flushTransportCache(encrypted);
	    }
	  }
	  return null;
	}

	function storeTransportCache(encrypted, transport, latency) {
	  var storage = Util.getLocalStorage();
	  if (storage) {
	    try {
	      storage[getTransportCacheKey(encrypted)] = JSON.stringify({
	        timestamp: Util.now(),
	        transport: transport,
	        latency: latency
	      });
	    } catch (e) {
	      // catch over quota exceptions raised by localStorage
	    }
	  }
	}

	function flushTransportCache(encrypted) {
	  var storage = Util.getLocalStorage();
	  if (storage) {
	    try {
	      delete storage[getTransportCacheKey(encrypted)];
	    } catch (e) {
	      // catch exceptions raised by localStorage
	    }
	  }
	}

	module.exports = CachedStrategy;


/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	var Timer = __webpack_require__(3).Timer;

	/** Runs substrategy after specified delay.
	 *
	 * Options:
	 * - delay - time in miliseconds to delay the substrategy attempt
	 *
	 * @param {Strategy} strategy
	 * @param {Object} options
	 */
	function DelayedStrategy(strategy, options) {
	  this.strategy = strategy;
	  this.options = { delay: options.delay };
	}
	var prototype = DelayedStrategy.prototype;

	prototype.isSupported = function() {
	  return this.strategy.isSupported();
	};

	prototype.connect = function(minPriority, callback) {
	  var strategy = this.strategy;
	  var runner;
	  var timer = new Timer(this.options.delay, function() {
	    runner = strategy.connect(minPriority, callback);
	  });

	  return {
	    abort: function() {
	      timer.ensureAborted();
	      if (runner) {
	        runner.abort();
	      }
	    },
	    forceMinPriority: function(p) {
	      minPriority = p;
	      if (runner) {
	        runner.forceMinPriority(p);
	      }
	    }
	  };
	};

	module.exports = DelayedStrategy;


/***/ },
/* 42 */
/***/ function(module, exports) {

	/** Proxies method calls to one of substrategies basing on the test function.
	 *
	 * @param {Function} test
	 * @param {Strategy} trueBranch strategy used when test returns true
	 * @param {Strategy} falseBranch strategy used when test returns false
	 */
	function IfStrategy(test, trueBranch, falseBranch) {
	  this.test = test;
	  this.trueBranch = trueBranch;
	  this.falseBranch = falseBranch;
	}
	var prototype = IfStrategy.prototype;

	prototype.isSupported = function() {
	  var branch = this.test() ? this.trueBranch : this.falseBranch;
	  return branch.isSupported();
	};

	prototype.connect = function(minPriority, callback) {
	  var branch = this.test() ? this.trueBranch : this.falseBranch;
	  return branch.connect(minPriority, callback);
	};

	module.exports = IfStrategy;


/***/ },
/* 43 */
/***/ function(module, exports) {

	/** Launches the substrategy and terminates on the first open connection.
	 *
	 * @param {Strategy} strategy
	 */
	function FirstConnectedStrategy(strategy) {
	  this.strategy = strategy;
	}
	var prototype = FirstConnectedStrategy.prototype;

	prototype.isSupported = function() {
	  return this.strategy.isSupported();
	};

	prototype.connect = function(minPriority, callback) {
	  var runner = this.strategy.connect(
	    minPriority,
	    function(error, handshake) {
	      if (handshake) {
	        runner.abort();
	      }
	      callback(error, handshake);
	    }
	  );
	  return runner;
	};

	module.exports = FirstConnectedStrategy;


/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);
	var EventsDispatcher = __webpack_require__(7);
	var Timer = __webpack_require__(3).Timer;
	var Network = __webpack_require__(45).Network;
	var Logger = __webpack_require__(8);

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
	function ConnectionManager(key, options) {
	  EventsDispatcher.call(this);

	  this.key = key;
	  this.options = options || {};
	  this.state = "initialized";
	  this.connection = null;
	  this.encrypted = !!options.encrypted;
	  this.timeline = this.options.timeline;

	  this.connectionCallbacks = this.buildConnectionCallbacks();
	  this.errorCallbacks = this.buildErrorCallbacks();
	  this.handshakeCallbacks = this.buildHandshakeCallbacks(this.errorCallbacks);

	  var self = this;

	  Network.bind("online", function() {
	    self.timeline.info({ netinfo: "online" });
	    if (self.state === "connecting" || self.state === "unavailable") {
	      self.retryIn(0);
	    }
	  });
	  Network.bind("offline", function() {
	    self.timeline.info({ netinfo: "offline" });
	    if (self.connection) {
	      self.sendActivityCheck();
	    }
	  });

	  this.updateStrategy();
	}
	var prototype = ConnectionManager.prototype;

	Util.extend(prototype, EventsDispatcher.prototype);

	/** Establishes a connection to Pusher.
	 *
	 * Does nothing when connection is already established. See top-level doc
	 * to find events emitted on connection attempts.
	 */
	prototype.connect = function() {
	  if (this.connection || this.runner) {
	    return;
	  }
	  if (!this.strategy.isSupported()) {
	    this.updateState("failed");
	    return;
	  }
	  this.updateState("connecting");
	  this.startConnecting();
	  this.setUnavailableTimer();
	};

	/** Sends raw data.
	 *
	 * @param {String} data
	 */
	prototype.send = function(data) {
	  if (this.connection) {
	    return this.connection.send(data);
	  } else {
	    return false;
	  }
	};

	/** Sends an event.
	 *
	 * @param {String} name
	 * @param {String} data
	 * @param {String} [channel]
	 * @returns {Boolean} whether message was sent or not
	 */
	prototype.send_event = function(name, data, channel) {
	  if (this.connection) {
	    return this.connection.send_event(name, data, channel);
	  } else {
	    return false;
	  }
	};

	/** Closes the connection. */
	prototype.disconnect = function() {
	  this.disconnectInternally();
	  this.updateState("disconnected");
	};

	prototype.isEncrypted = function() {
	  return this.encrypted;
	};

	/** @private */
	prototype.startConnecting = function() {
	  var self = this;
	  var callback = function(error, handshake) {
	    if (error) {
	      self.runner = self.strategy.connect(0, callback);
	    } else {
	      if (handshake.action === "error") {
	        self.emit("error", { type: "HandshakeError", error: handshake.error });
	        self.timeline.error({ handshakeError: handshake.error });
	      } else {
	        self.abortConnecting(); // we don't support switching connections yet
	        self.handshakeCallbacks[handshake.action](handshake);
	      }
	    }
	  };
	  self.runner = self.strategy.connect(0, callback);
	};

	/** @private */
	prototype.abortConnecting = function() {
	  if (this.runner) {
	    this.runner.abort();
	    this.runner = null;
	  }
	};

	/** @private */
	prototype.disconnectInternally = function() {
	  this.abortConnecting();
	  this.clearRetryTimer();
	  this.clearUnavailableTimer();
	  if (this.connection) {
	    var connection = this.abandonConnection();
	    connection.close();
	  }
	};

	/** @private */
	prototype.updateStrategy = function() {
	  this.strategy = this.options.getStrategy({
	    key: this.key,
	    timeline: this.timeline,
	    encrypted: this.encrypted
	  });
	};

	/** @private */
	prototype.retryIn = function(delay) {
	  var self = this;
	  self.timeline.info({ action: "retry", delay: delay });
	  if (delay > 0) {
	    self.emit("connecting_in", Math.round(delay / 1000));
	  }
	  self.retryTimer = new Timer(delay || 0, function() {
	    self.disconnectInternally();
	    self.connect();
	  });
	};

	/** @private */
	prototype.clearRetryTimer = function() {
	  if (this.retryTimer) {
	    this.retryTimer.ensureAborted();
	    this.retryTimer = null;
	  }
	};

	/** @private */
	prototype.setUnavailableTimer = function() {
	  var self = this;
	  self.unavailableTimer = new Timer(
	    self.options.unavailableTimeout,
	    function() {
	      self.updateState("unavailable");
	    }
	  );
	};

	/** @private */
	prototype.clearUnavailableTimer = function() {
	  if (this.unavailableTimer) {
	    this.unavailableTimer.ensureAborted();
	  }
	};

	/** @private */
	prototype.sendActivityCheck = function() {
	  var self = this;
	  self.stopActivityCheck();
	  self.connection.ping();
	  // wait for pong response
	  self.activityTimer = new Timer(
	    self.options.pongTimeout,
	    function() {
	      self.timeline.error({ pong_timed_out: self.options.pongTimeout });
	      self.retryIn(0);
	    }
	  );
	};

	/** @private */
	prototype.resetActivityCheck = function() {
	  var self = this;
	  self.stopActivityCheck();
	  // send ping after inactivity
	  if (!self.connection.handlesActivityChecks()) {
	    self.activityTimer = new Timer(self.activityTimeout, function() {
	      self.sendActivityCheck();
	    });
	  }
	};

	/** @private */
	prototype.stopActivityCheck = function() {
	  if (this.activityTimer) {
	    this.activityTimer.ensureAborted();
	  }
	};

	/** @private */
	prototype.buildConnectionCallbacks = function() {
	  var self = this;
	  return {
	    message: function(message) {
	      // includes pong messages from server
	      self.resetActivityCheck();
	      self.emit('message', message);
	    },
	    ping: function() {
	      self.send_event('pusher:pong', {});
	    },
	    activity: function() {
	      self.resetActivityCheck();
	    },
	    error: function(error) {
	      // just emit error to user - socket will already be closed by browser
	      self.emit("error", { type: "WebSocketError", error: error });
	    },
	    closed: function() {
	      self.abandonConnection();
	      if (self.shouldRetry()) {
	        self.retryIn(1000);
	      }
	    }
	  };
	};

	/** @private */
	prototype.buildHandshakeCallbacks = function(errorCallbacks) {
	  var self = this;
	  return Util.extend({}, errorCallbacks, {
	    connected: function(handshake) {
	      self.activityTimeout = Math.min(
	        self.options.activityTimeout,
	        handshake.activityTimeout,
	        handshake.connection.activityTimeout || Infinity
	      );
	      self.clearUnavailableTimer();
	      self.setConnection(handshake.connection);
	      self.socket_id = self.connection.id;
	      self.updateState("connected", { socket_id: self.socket_id });
	    }
	  });
	};

	/** @private */
	prototype.buildErrorCallbacks = function() {
	  var self = this;

	  function withErrorEmitted(callback) {
	    return function(result) {
	      if (result.error) {
	        self.emit("error", { type: "WebSocketError", error: result.error });
	      }
	      callback(result);
	    };
	  }

	  return {
	    ssl_only: withErrorEmitted(function() {
	      self.encrypted = true;
	      self.updateStrategy();
	      self.retryIn(0);
	    }),
	    refused: withErrorEmitted(function() {
	      self.disconnect();
	    }),
	    backoff: withErrorEmitted(function() {
	      self.retryIn(1000);
	    }),
	    retry: withErrorEmitted(function() {
	      self.retryIn(0);
	    })
	  };
	};

	/** @private */
	prototype.setConnection = function(connection) {
	  this.connection = connection;
	  for (var event in this.connectionCallbacks) {
	    this.connection.bind(event, this.connectionCallbacks[event]);
	  }
	  this.resetActivityCheck();
	};

	/** @private */
	prototype.abandonConnection = function() {
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
	prototype.updateState = function(newState, data) {
	  var previousState = this.state;
	  this.state = newState;
	  if (previousState !== newState) {
	    Logger.debug('State changed', previousState + ' -> ' + newState);
	    this.timeline.info({ state: newState, params: data });
	    this.emit('state_change', { previous: previousState, current: newState });
	    this.emit(newState, data);
	  }
	};

	/** @private */
	prototype.shouldRetry = function() {
	  return this.state === "connecting" || this.state === "connected";
	};

	module.exports = ConnectionManager;


/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	var EventsDispatcher = __webpack_require__(7);
	var Util = __webpack_require__(1);

	function NetInfo(){
	  EventsDispatcher.call(this);
	}

	Util.extend(NetInfo.prototype, EventsDispatcher.prototype);

	var prototype = NetInfo.prototype;

	prototype.isOnline = function(){
	  return true;
	}

	exports.NetInfo = NetInfo;
	exports.Network = new NetInfo();

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	var Defaults = __webpack_require__(10);

	exports.getGlobalConfig = function() {
	  return {
	    wsHost: Defaults.host,
	    wsPort: Defaults.ws_port,
	    wssPort: Defaults.wss_port,
	    httpHost: Defaults.sockjs_host,
	    httpPort: Defaults.sockjs_http_port,
	    httpsPort: Defaults.sockjs_https_port,
	    httpPath: Defaults.sockjs_path,
	    statsHost: Defaults.stats_host,
	    authEndpoint: Defaults.channel_auth_endpoint,
	    authTransport: Defaults.channel_auth_transport,
	    // TODO make this consistent with other options in next major version
	    activity_timeout: Defaults.activity_timeout,
	    pong_timeout: Defaults.pong_timeout,
	    unavailable_timeout: Defaults.unavailable_timeout
	  };
	};

	exports.getClusterConfig = function(clusterName) {
	  return {
	    wsHost: "ws-" + clusterName + ".pusher.com",
	    httpHost: "sockjs-" + clusterName + ".pusher.com"
	  };
	};


/***/ }
/******/ ]);