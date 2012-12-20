;(function() {
  if (Function.prototype.scopedTo === undefined) {
    Function.prototype.scopedTo = function(context, args) {
      var f = this;
      return function() {
        return f.apply(context, Array.prototype.slice.call(args || [])
                       .concat(Array.prototype.slice.call(arguments)));
      };
    };
  }

  var Pusher = function(app_key, options) {
    this.options = options || {};
    this.key = app_key;
    this.channels = new Pusher.Channels();
    this.global_emitter = new Pusher.EventsDispatcher()

    var self = this;

    this.checkAppKey();

    this.connection = new Pusher.ConnectionManager(
      this.key,
      Pusher.Util.extend(
        { activityTimeout: Pusher.activity_timeout,
          pongTimeout: Pusher.pong_timeout,
          unavailableTimeout: Pusher.unavailable_timeout
        },
        this.options
      )
    );

    // Setup / teardown connection
    this.connection
      .bind('connected', function() {
        self.subscribeAll();
      })
      .bind('message', function(params) {
        var internal = (params.event.indexOf('pusher_internal:') === 0);
        if (params.channel) {
          var channel;
          if (channel = self.channel(params.channel)) {
            channel.emit(params.event, params.data);
          }
        }
        // Emit globaly [deprecated]
        if (!internal) self.global_emitter.emit(params.event, params.data);
      })
      .bind('disconnected', function() {
        self.channels.disconnect();
      })
      .bind('error', function(err) {
        Pusher.warn('Error', err);
      });

    Pusher.instances.push(this);

    if (Pusher.isReady) self.connect();
  };
  Pusher.instances = [];
  Pusher.prototype = {
    channel: function(name) {
      return this.channels.find(name);
    },

    connect: function() {
      this.connection.connect();
    },

    disconnect: function() {
      this.connection.disconnect();
    },

    bind: function(event_name, callback) {
      this.global_emitter.bind(event_name, callback);
      return this;
    },

    bind_all: function(callback) {
      this.global_emitter.bind_all(callback);
      return this;
    },

    subscribeAll: function() {
      var channel;
      for (channelName in this.channels.channels) {
        if (this.channels.channels.hasOwnProperty(channelName)) {
          this.subscribe(channelName);
        }
      }
    },

    subscribe: function(channel_name) {
      var self = this;
      var channel = this.channels.add(channel_name, this);

      if (this.connection.state === 'connected') {
        channel.authorize(this.connection.socket_id, this.options, function(err, data) {
          if (err) {
            channel.emit('pusher:subscription_error', data);
          } else {
            self.send_event('pusher:subscribe', {
              channel: channel_name,
              auth: data.auth,
              channel_data: data.channel_data
            });
          }
        });
      }
      return channel;
    },

    unsubscribe: function(channel_name) {
      this.channels.remove(channel_name);
      if (this.connection.state === 'connected') {
        this.send_event('pusher:unsubscribe', {
          channel: channel_name
        });
      }
    },

    send_event: function(event_name, data, channel) {
      return this.connection.send_event(event_name, data, channel);
    },

    checkAppKey: function() {
      if(this.key === null || this.key === undefined) {
        Pusher.warn('Warning', 'You must pass your app key when you instantiate Pusher.');
      }
    }
  };

  Pusher.Util = {
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
    extend: function extend(target) {
      for (var i = 1; i < arguments.length; i++) {
        var extensions = arguments[i];
        for (var property in extensions) {
          if (extensions[property] && extensions[property].constructor &&
              extensions[property].constructor === Object) {
            target[property] = extend(target[property] || {}, extensions[property]);
          } else {
            target[property] = extensions[property];
          }
        }
      }
      return target;
    },

    stringify: function stringify() {
      var m = ["Pusher"]
      for (var i = 0; i < arguments.length; i++){
        if (typeof arguments[i] === "string") {
          m.push(arguments[i])
        } else {
          if (window['JSON'] == undefined) {
            m.push(arguments[i].toString());
          } else {
            m.push(JSON.stringify(arguments[i]))
          }
        }
      };
      return m.join(" : ")
    },

    arrayIndexOf: function(array, item) { // MSIE doesn't have array.indexOf
      var nativeIndexOf = Array.prototype.indexOf;
      if (array == null) return -1;
      if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
      for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
      return -1;
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
    apply: function(array, f) {
      for (var i = 0; i < array.length; i++) {
        f(array[i], i, array);
      }
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
      for (var key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          result[key] = f(object[key]);
        }
      }
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
      test = test || function(value) { return !!value; };

      var result = {};
      for (var key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          if (test(object[key], key, object, result)) {
            result[key] = object[key];
          }
        }
      }
      return result;
    },

    /** Flattens an object into a two-dimensional array.
     *
     * @param  {Object} object
     * @return {Array} resulting array of [key, value] pairs
     */
    flatten: function(object) {
      var result = [];
      for (var key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          result.push([key, object[key]]);
        }
      }
      return result;
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
    }
  };

  // To receive log output provide a Pusher.log function, for example
  // Pusher.log = function(m){console.log(m)}
  Pusher.debug = function() {
    if (!Pusher.log) return
    Pusher.log(Pusher.Util.stringify.apply(this, arguments))
  }
  Pusher.warn = function() {
    if (window.console && window.console.warn) {
      window.console.warn(Pusher.Util.stringify.apply(this, arguments));
    } else {
      if (!Pusher.log) return
      Pusher.log(Pusher.Util.stringify.apply(this, arguments));
    }
  };

  // Pusher defaults
  Pusher.VERSION = '<VERSION>';
  // WS connection parameters
  Pusher.host = 'ws.pusherapp.com';
  Pusher.ws_port = 80;
  Pusher.wss_port = 443;
  // SockJS fallback parameters
  Pusher.sockjs_host = 'sockjs.pusher.com';
  Pusher.sockjs_http_port = 80
  Pusher.sockjs_https_port = 443
  Pusher.sockjs_path = "/pusher"
  // Stats
  Pusher.stats_host = 'stats.pusher.com';
  // Other settings
  Pusher.channel_auth_endpoint = '/pusher/auth';
  Pusher.cdn_http = '<CDN_HTTP>'
  Pusher.cdn_https = '<CDN_HTTPS>'
  Pusher.dependency_suffix = '<DEPENDENCY_SUFFIX>';
  Pusher.channel_auth_transport = 'ajax';
  Pusher.activity_timeout = 120000;
  Pusher.pong_timeout = 30000;
  Pusher.unavailable_timeout = 10000;

  Pusher.isReady = false;
  Pusher.ready = function() {
    Pusher.isReady = true;
    for (var i = 0, l = Pusher.instances.length; i < l; i++) {
      Pusher.instances[i].connect();
    }
  };

  Pusher.defaultStrategy = {
    type: "first_supported",
    host: "ws.pusherapp.com",
    unencryptedPort: 80,
    encryptedPort: 443,
    loop: true,
    timeoutLimit: 8000,
    children: [
      { type: "sequential",
        timeout: 2000,
        children: [
          { type: "transport", transport: "ws" },
          { type: "transport", transport: "ws", encrypted: true }
        ]
      },
      { type: "sequential",
        timeout: 5000,
        children: [
          { type: "transport", transport: "flash" },
          { type: "transport", transport: "flash", encrypted: true }
        ]
      },
      { type: "sequential",
        timeout: 2000,
        host: "sockjs.pusher.com",
        children: [
          { type: "transport", transport: "sockjs" },
          { type: "transport", transport: "sockjs", encrypted: true }
        ]
      }
    ]
  };

  this.Pusher = Pusher;
}).call(this);
