describe("TransportStrategy", function() {
  var transportClass, connection;
  var callback;
  var strategy;

  beforeEach(function() {
    var transport = Pusher.Mocks.getTransport(true);
    transportClass = Pusher.Mocks.getTransportClass(true, transport);
    connection = Pusher.Mocks.getConnection();

    spyOn(Pusher, "ProtocolWrapper").andReturn(connection);

    strategy = new Pusher.TransportStrategy(
      "name", 1, transportClass, { key: "foo" }
    );

    callback = jasmine.createSpy("connectCallback");
  });

  describe("#isSupported", function() {
    it("should return true when transport is supported", function() {
      var transportClass = Pusher.Mocks.getTransportClass(true);
      var strategy = new Pusher.TransportStrategy("name", 1, transportClass);

      expect(strategy.isSupported()).toBe(true);
      expect(transportClass.isSupported).toHaveBeenCalledWith({
        disableFlash: false
      });
    });

    it("should return false when transport is not supported", function() {
      var strategy = new Pusher.TransportStrategy(
        "name", 1, Pusher.Mocks.getTransportClass(false)
      );
      expect(strategy.isSupported()).toBe(false);
    });

    it("should pass the disableFlash flag to the transport", function() {
      var transportClass = Pusher.Mocks.getTransportClass(true);
      var strategy = new Pusher.TransportStrategy("name", 1, transportClass, {
        disableFlash: true
      });

      strategy.isSupported();
      expect(transportClass.isSupported).toHaveBeenCalledWith({
        disableFlash: true
      });
    });
  });

  describe("#connect", function() {
    it("should pass key and options to the transport", function() {
      var options = {
        key: "asdf",
        foo: "bar"
      };
      var strategy = new Pusher.TransportStrategy(
        "name", 1, transportClass, options
      );

      strategy.connect(0, callback);
      expect(transportClass.createConnection)
        .toHaveBeenCalledWith("name", 1, "asdf", options);
    });

    it("should call connect on the connection after initializing", function() {
      strategy.connect(0, callback);
      expect(connection.initialize).toHaveBeenCalled();
      expect(connection.connect).not.toHaveBeenCalled();

      connection.state = "initialized";
      connection.emit("initialized");

      expect(connection.connect).toHaveBeenCalled();
    });

    it("should call back with a connection after getting an 'open' event", function() {
      strategy.connect(0, callback);

      connection.state = "initialized";
      connection.emit("initialized");
      connection.state = "connecting";
      connection.emit("connecting");

      expect(callback).not.toHaveBeenCalled();

      connection.state = "open";
      connection.emit("open");

      expect(callback).toHaveBeenCalledWith(null, connection);
    });

    it("should call back with an error after getting an 'error' event", function() {
      strategy.connect(0, callback);

      connection.state = "initialized";
      connection.emit("initialized");
      connection.state = "connecting";
      connection.emit("connecting");
      connection.emit("error", {
        type: "WebSocketError",
        error: 123
      });

      expect(callback).toHaveBeenCalledWith({
        type: "WebSocketError",
        error: 123
      });
    });

    it("should call back with an error when connection closes prematurely", function() {
      strategy.connect(0, callback);

      connection.state = "initialized";
      connection.emit("initialized");
      connection.state = "initialized";
      connection.emit("initialized");
      connection.state = "connecting";
      connection.emit("connecting");
      connection.state = "closed";
      connection.emit("closed");

      expect(callback)
        .toHaveBeenCalledWith(jasmine.any(Pusher.Errors.TransportClosed));
    });

    it("should call back with an error if transport's priority is too low", function() {
      runs(function() {
        strategy.connect(2, callback);
      });
      waitsFor(function() {
        return callback.calls.length > 0;
      }, "callback to be called", 100);
      runs(function() {
        expect(callback).toHaveBeenCalledWith(
          jasmine.any(Pusher.Errors.TransportPriorityTooLow)
        );
      });
    });

    it("should call back with an error if transport is not supported", function() {
      transportClass.isSupported.andReturn(false);
      runs(function() {
        strategy.connect(0, callback);
      });
      waitsFor(function() {
        return callback.calls.length > 0;
      }, "callback to be called", 100);
      runs(function() {
        expect(callback).toHaveBeenCalledWith(
          jasmine.any(Pusher.Errors.UnsupportedStrategy)
        );
      });
    });
  });

  describe("runner.abort", function() {
    it("should close connection in 'connecting' state", function() {
      var runner = strategy.connect(0, callback);

      connection.state = "initialized";
      connection.emit("initialized");
      connection.state = "connecting";
      connection.emit("connecting");

      runner.abort();

      expect(connection.close).toHaveBeenCalled();
    });

    it("should not close connection in 'open' state", function() {
      var runner = strategy.connect(0, callback);

      connection.state = "initialized";
      connection.emit("initialized");
      connection.state = "connecting";
      connection.emit("connecting");
      connection.state = "open";
      connection.emit("open");

      runner.abort();

      expect(connection.close).not.toHaveBeenCalled();
    });

    it("should not close connection in 'connected' state", function() {
      var runner = strategy.connect(0, callback);

      connection.state = "initialized";
      connection.emit("initialized");
      connection.state = "connecting";
      connection.emit("connecting");
      connection.state = "open";
      connection.emit("open");
      connection.state = "connected";
      connection.emit("connected");

      runner.abort();

      expect(connection.close).not.toHaveBeenCalled();
    });
  });

  describe("runner.forceMinPriority", function() {
    it("should close the connection if transport's priority is too low", function() {
      var runner = strategy.connect(0, callback);
      runner.forceMinPriority(5);
      expect(connection.close).toHaveBeenCalled();
    });

    it("should not close the connection if transport's priority is high enough", function() {
      var runner = strategy.connect(0, callback);
      runner.forceMinPriority(1);
      expect(connection.close).not.toHaveBeenCalled();
    });

    it("should close the connection with too low priority in 'connecting' state", function() {
      var runner = strategy.connect(0, callback);

      connection.state = "initialized";
      connection.emit("initialized");
      connection.state = "connecting";
      connection.emit("connecting");

      runner.forceMinPriority(5);

      expect(connection.close).toHaveBeenCalled();
    });

    it("should not close the connection with too low priority in 'open' state", function() {
      var runner = strategy.connect(0, callback);

      connection.state = "initialized";
      connection.emit("initialized");
      connection.state = "connecting";
      connection.emit("connecting");
      connection.state = "open";
      connection.emit("open");

      runner.forceMinPriority(5);

      expect(connection.close).not.toHaveBeenCalled();
    });

    it("should not close the connection with too low priority in 'connected' state", function() {
      var runner = strategy.connect(0, callback);

      connection.state = "initialized";
      connection.emit("initialized");
      connection.state = "connecting";
      connection.emit("connecting");
      connection.state = "open";
      connection.emit("open");
      connection.state = "connected";
      connection.emit("connected");

      runner.forceMinPriority(5);

      expect(connection.close).not.toHaveBeenCalled();
    });
  });
});
