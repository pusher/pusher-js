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

  prototype.initialize = function() {
    this.connection = this.transport.createConnection(
      this.options.key, this.options
    );
    this.connection.initialize();
  };

  prototype.connect = function() {
    var self = this;

    if (!this.connection) {
      return false;
    }
    if (this.connection.state === "initializing") {
      if (this.initializedCallback) {
        return false;
      }
      this.initializedCallback = function() {
        self.connection.unbind("initialized", self.initializedCallback);
        self.initializedCallback = null;
        self.connect();
      };
      this.connection.bind("initialized", this.initializedCallback);
      return true;
    }
    if (this.connection.state !== "initialized") {
      return false;
    }

    var onOpen = function() {
      unbindListeners();
      self.emit("open", self.connection);
    };
    var onError = function(error) {
      unbindListeners();
      self.emit("error", error);
    };
    var onClosed = function() {
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
