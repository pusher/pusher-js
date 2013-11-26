describe("TransportStrategy", function() {
  var transport, transportClass, handshake;
  var callback;
  var strategy;

  beforeEach(function() {
    transport = Pusher.Mocks.getTransport(true);
    transportClass = Pusher.Mocks.getTransportClass(true, transport);

    spyOn(Pusher, "Handshake").andCallFake(function(transport, callback) {
      handshake = Pusher.Mocks.getHandshake(transport, callback);
      return handshake;
    });

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
    });

    it("should return false when transport is not supported", function() {
      var strategy = new Pusher.TransportStrategy(
        "name", 1, Pusher.Mocks.getTransportClass(false)
      );
      expect(strategy.isSupported()).toBe(false);
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

    it("should call connect on the transport after initializing", function() {
      strategy.connect(0, callback);
      expect(transport.initialize).toHaveBeenCalled();
      expect(transport.connect).not.toHaveBeenCalled();

      transport.state = "initialized";
      transport.emit("initialized");

      expect(transport.connect).toHaveBeenCalled();
    });

    it("should not call back before processing a handshake", function() {
      strategy.connect(0, callback);

      transport.state = "initialized";
      transport.emit("initialized");
      transport.state = "connecting";
      transport.emit("connecting");
      transport.state = "open";
      transport.emit("open");

      expect(callback).not.toHaveBeenCalled();
    });

    it("should call back with a 'connected' action, the transport and a connection after processing it successfully", function() {
      strategy.connect(0, callback);

      transport.state = "initialized";
      transport.emit("initialized");
      transport.state = "connecting";
      transport.emit("connecting");
      transport.state = "open";
      transport.emit("open");

      var handshakeResult = {
        action: "connected",
        transport: transport,
        connection: Pusher.Mocks.getConnection()
      };
      handshake._callback(handshakeResult);

      expect(callback).toHaveBeenCalledWith(null, handshakeResult);
    });

    it("should call back with an error after getting an 'error' event", function() {
      strategy.connect(0, callback);

      transport.state = "initialized";
      transport.emit("initialized");
      transport.emit("error", {
        type: "WebSocketError",
        error: 123
      });

      expect(callback).toHaveBeenCalledWith({
        type: "WebSocketError",
        error: 123
      });
    });

    it("should call back with an error when transport closes prematurely", function() {
      strategy.connect(0, callback);

      transport.state = "initialized";
      transport.emit("initialized");
      transport.state = "closed";
      transport.emit("closed");

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
    it("should close transport in 'connecting' state", function() {
      var runner = strategy.connect(0, callback);

      transport.state = "initialized";
      transport.emit("initialized");
      transport.state = "connecting";
      transport.emit("connecting");

      runner.abort();

      expect(transport.close).toHaveBeenCalled();
    });

    it("should close handshake before processing a it", function() {
      var runner = strategy.connect(0, callback);

      transport.state = "initialized";
      transport.emit("initialized");
      transport.state = "connecting";
      transport.emit("connecting");
      transport.state = "open";
      transport.emit("open");

      runner.abort();

      expect(handshake.close).toHaveBeenCalled();
    });

    it("should not close transport after processing a handshake", function() {
      var runner = strategy.connect(0, callback);

      transport.state = "initialized";
      transport.emit("initialized");
      transport.state = "connecting";
      transport.emit("connecting");
      transport.state = "open";
      transport.emit("open");
      handshake._callback();

      runner.abort();

      expect(transport.close).not.toHaveBeenCalled();
    });
  });

  describe("runner.forceMinPriority", function() {
    it("should close the transport if transport's priority is too low", function() {
      var runner = strategy.connect(0, callback);
      runner.forceMinPriority(5);
      expect(transport.close).toHaveBeenCalled();
    });

    it("should not close the transport if transport's priority is high enough", function() {
      var runner = strategy.connect(0, callback);
      runner.forceMinPriority(1);
      expect(transport.close).not.toHaveBeenCalled();
    });

    it("should close the handshake with too low priority before processing it", function() {
      var runner = strategy.connect(0, callback);

      transport.state = "initialized";
      transport.emit("initialized");
      transport.state = "connecting";
      transport.emit("connecting");
      transport.state = "open";
      transport.emit("open");

      runner.forceMinPriority(5);

      expect(handshake.close).toHaveBeenCalled();
    });

    it("should not close the transport with too low priority after processing a handshake", function() {
      var runner = strategy.connect(0, callback);

      transport.state = "initialized";
      transport.emit("initialized");
      transport.state = "connecting";
      transport.emit("connecting");
      transport.state = "open";
      transport.emit("open");
      handshake._callback();

      runner.forceMinPriority(5);

      expect(transport.close).not.toHaveBeenCalled();
    });
  });
});
