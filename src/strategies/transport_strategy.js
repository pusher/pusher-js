;(function() {

  function TransportStrategy(transport, options) {
    Pusher.EventsDispatcher.call(this);
    this.transport = transport;
    this.options = options;
  }
  var prototype = TransportStrategy.prototype;

  prototype.name = "transport";

  prototype.isSupported = function() {
    return this.transport.isSupported();
  };

  prototype.getEncrypted = function() {
    return new TransportStrategy(
      this.transport,
      Pusher.Util.extend(this.options, { encrypted: true })
    )
  };

  prototype.connect = function(callback) {
    var self = this;

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
      callback("closed"); // TODO return something meaningful
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
    }
  };

  Pusher.TransportStrategy = TransportStrategy;
}).call(this);
