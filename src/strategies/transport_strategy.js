;(function() {

  function TransportStrategy(transport, options) {
    Pusher.AbstractStrategy.call(this, options);
    this.transport = transport;
  }
  var prototype = TransportStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.AbstractStrategy.prototype);

  prototype.name = "transport";

  prototype.isSupported = function() {
    return this.transport.isSupported();
  };

  prototype.forceSecure = function(value) {
    this.options.secure = value;
  };

  prototype.connect = function() {
    if (this.abortCallback) {
      return false;
    }

    this.connection = this.transport.createConnection(
      this.options.key, this.options
    );
    this.connection.initialize();

    if (this.connection.state === "initializing") {
      var self = this;
      this.initializedCallback = function() {
        self.connection.unbind("initialized", self.initializedCallback);
        self.initializedCallback = null;
        self.connectInitialized();
      };
      this.connection.bind("initialized", this.initializedCallback);
      return true;
    }

    return this.connectInitialized();
  };

  // private

  prototype.connectInitialized = function() {
    if (this.connection.state !== "initialized") {
      return false;
    }

    var self = this;

    var onOpen = function() {
      self.abortCallback = null;
      unbindListeners();
      self.emit("open", self.connection);
    };
    var onError = function(error) {
      self.abortCallback = null;
      unbindListeners();
      self.emit("error", error);
    };
    var onClosed = function() {
      self.abortCallback = null;
      unbindListeners();
      self.emit("error", "closed"); // TODO return something meaningful
    };

    var unbindListeners = function() {
      self.connection.unbind("open", onOpen);
      self.connection.unbind("error", onError);
      self.connection.unbind("closed", onClosed);
    };

    this.abortCallback = function() {
      unbindListeners();
      self.connection.close();
      self.connection = null;
    };

    this.connection.bind("open", onOpen);
    this.connection.bind("error", onError);
    this.connection.bind("closed", onClosed);

    this.connection.connect();

    return true;
  };

  Pusher.TransportStrategy = TransportStrategy;
}).call(this);
