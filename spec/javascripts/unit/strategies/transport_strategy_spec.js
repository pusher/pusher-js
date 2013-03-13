describe("TransportStrategy", function() {
  beforeEach(function() {
    this.transport = Pusher.Mocks.getTransport();
    this.transportClass = Pusher.Mocks.getTransportClass(true, this.transport);
    this.strategy = new Pusher.TransportStrategy(
      "name", 1, this.transportClass, { key: "foo" }
    );

    this.callback = jasmine.createSpy("connectCallback");
  });

  describe("after calling isSupported", function() {
    it("should return true when transport is supported", function() {
      var transport = Pusher.Mocks.getTransportClass(true);
      var strategy = new Pusher.TransportStrategy("name", 1, transport);

      expect(strategy.isSupported()).toBe(true);
      expect(transport.isSupported).toHaveBeenCalledWith({
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
      var transport = Pusher.Mocks.getTransportClass(true);
      var strategy = new Pusher.TransportStrategy("name", 1, transport, {
        disableFlash: true
      });

      strategy.isSupported();
      expect(transport.isSupported).toHaveBeenCalledWith({
        disableFlash: true
      });
    });
  });

  describe("on connect", function() {
    it("should pass key and options to the transport", function() {
      var options = {
        key: "asdf",
        foo: "bar"
      };
      var strategy = new Pusher.TransportStrategy(
        "name", 1, this.transportClass, options
      );

      strategy.connect(0, this.callback);
      expect(this.transportClass.createConnection)
        .toHaveBeenCalledWith("name", 1, "asdf", options);
    });

    it("should emit open on success", function() {
      this.strategy.connect(0, this.callback);
      expect(this.transport.initialize).toHaveBeenCalled();
      expect(this.transport.connect).not.toHaveBeenCalled();

      this.transport.state = "initialized";
      this.transport.emit("initialized");
      expect(this.transport.connect).toHaveBeenCalled();

      this.transport.state = "open";
      this.transport.emit("open");
      expect(this.callback).toHaveBeenCalledWith(null, this.transport);
    });

    it("should emit error on a connection error", function() {
      this.strategy.connect(0, this.callback);
      this.transport.state = "initialized";
      this.transport.emit("initialized");

      this.transport.emit("error", 123);
      expect(this.callback).toHaveBeenCalledWith(123);
    });

    it("should emit error on connection closed", function() {
      this.strategy.connect(0, this.callback);
      this.transport.state = "initialized";
      this.transport.emit("initialized");

      this.transport.state = "closed";
      this.transport.emit("closed");
      expect(this.callback)
        .toHaveBeenCalledWith(jasmine.any(Pusher.Errors.TransportClosed));
    });

    it("should call back with an error if transport's priority is too low", function() {
      runs(function() {
        this.strategy.connect(2, this.callback);
      });
      waitsFor(function() {
        return this.callback.calls.length > 0;
      }, "callback to be called", 100);
      runs(function() {
        expect(this.callback).toHaveBeenCalledWith(
          jasmine.any(Pusher.Errors.TransportPriorityTooLow)
        );
      });
    });

    it("should call back with an error if transport is not supported", function() {
      this.transportClass.isSupported.andReturn(false);
      runs(function() {
        this.strategy.connect(0, this.callback);
      });
      waitsFor(function() {
        return this.callback.calls.length > 0;
      }, "callback to be called", 100);
      runs(function() {
        expect(this.callback).toHaveBeenCalledWith(
          jasmine.any(Pusher.Errors.UnsupportedStrategy)
        );
      });
    });
  });

  describe("on abort", function() {
    it("should close unestablished connection", function() {
      var runner = this.strategy.connect(0, this.callback);

      this.transport.state = "initialized";
      this.transport.emit("initialized");
      this.transport.state = "connecting";
      this.transport.emit("connecting");

      runner.abort();

      expect(this.transport.close).toHaveBeenCalled();
    });

    it("should not close open connections", function() {
      var runner = this.strategy.connect(0, this.callback);

      this.transport.state = "initialized";
      this.transport.emit("initialized");
      this.transport.state = "connecting";
      this.transport.emit("connecting");
      this.transport.state = "open";
      this.transport.emit("open");

      runner.abort();

      expect(this.transport.close).not.toHaveBeenCalled();
    });
  });

  describe("on forceMinPriority", function() {
    it("should close the connection if transport's priority is too low", function() {
      var runner = this.strategy.connect(0, this.callback);
      runner.forceMinPriority(5);
      expect(this.transport.close).toHaveBeenCalled();
    });

    it("should not close the connection if transport's priority is high enough", function() {
      var runner = this.strategy.connect(0, this.callback);
      runner.forceMinPriority(1);
      expect(this.transport.close).not.toHaveBeenCalled();
    });

    it("should not close the connection if it's in 'open' state", function() {
      var runner = this.strategy.connect(0, this.callback);

      this.transport.state = "initialized";
      this.transport.emit("initialized");
      this.transport.state = "connecting";
      this.transport.emit("connecting");
      this.transport.state = "open";
      this.transport.emit("open");

      runner.forceMinPriority(5);

      expect(this.transport.close).not.toHaveBeenCalled();
    });
  });
});
