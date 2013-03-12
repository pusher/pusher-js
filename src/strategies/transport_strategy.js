;(function() {
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
      disableFlash: !!this.options.disableFlash
    });
  };

  /** Launches a connection attempt and returns a strategy runner.
   *
   * @param  {Function} callback
   * @return {Object} strategy runner
   */
  prototype.connect = function(minPriority, callback) {
    if (!this.transport.isSupported()) {
      return failAttempt(new Pusher.Errors.UnsupportedStrategy(), callback);
    } else if (this.priority < minPriority) {
      return failAttempt(new Pusher.Errors.TransportPriorityTooLow(), callback);
    }

    var self = this;
    var connection = this.transport.createConnection(
      this.name, this.priority, this.options.key, this.options
    );

    var onInitialized = function() {
      connection.unbind("initialized", onInitialized);
      connection.connect();
    };
    var onOpen = function() {
      unbindListeners();
      callback(null, connection);
    };
    var onError = function(error) {
      unbindListeners();
      callback(error);
    };
    var onClosed = function() {
      unbindListeners();
      callback(new Pusher.Errors.TransportClosed(this.transport));
    };

    var unbindListeners = function() {
      connection.unbind("initialized", onInitialized);
      connection.unbind("open", onOpen);
      connection.unbind("error", onError);
      connection.unbind("closed", onClosed);
    };

    connection.bind("initialized", onInitialized);
    connection.bind("open", onOpen);
    connection.bind("error", onError);
    connection.bind("closed", onClosed);

    // connect will be called automatically after initialization
    connection.initialize();

    return {
      abort: function() {
        if (connection.state === "open") {
          return;
        }
        unbindListeners();
        connection.close();
      },
      forceMinPriority: function(p) {
        if (connection.state === "open") {
          return;
        }
        if (self.priority < p) {
          // TODO close connection in a nicer way
          connection.close();
        }
      }
    };
  };

  function failAttempt(error, callback) {
    setTimeout(function() {
      callback(error);
    }, 0);
    return {
      abort: function() {},
      forceMinPriority: function() {}
    };
  }

  Pusher.TransportStrategy = TransportStrategy;
}).call(this);
