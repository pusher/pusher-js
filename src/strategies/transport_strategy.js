;(function() {
  /** Provides a strategy interface for transports.
   *
   * @param {Class} transport
   * @param {Object} options options to pass to the transport
   */
  function TransportStrategy(transport, options) {
    this.transport = transport;
    this.options = options;
  }
  var prototype = TransportStrategy.prototype;

  prototype.name = "transport";

  /** Returns whether the transport is supported in the browser.
   *
   * @returns {Boolean}
   */
  prototype.isSupported = function() {
    return this.transport.isSupported();
  };

  /** Creates an encrypted-only copy of itself, respecting the delay.
   *
   * @returns {TransportStrategy}
   */
  prototype.getEncrypted = function() {
    return new TransportStrategy(
      this.transport,
      Pusher.Util.extend(this.options, { encrypted: true })
    );
  };

  /** Launches a connection attempt and returns a strategy runner.
   *
   * @param  {Function} callback
   * @return {Object} strategy runner
   */
  prototype.connect = function(callback) {
    connection = this.transport.createConnection(
      this.options.key, this.options
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
      }
    };
  };

  Pusher.TransportStrategy = TransportStrategy;
}).call(this);
