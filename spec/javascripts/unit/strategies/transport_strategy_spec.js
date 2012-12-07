describe("TransportStrategy", function() {
  function getConnectionMock() {
    var connection = new Pusher.EventsDispatcher();

    connection.initialize = jasmine.createSpy("initialize")
      .andCallFake(function() {
        connection.state = "initializing";
        connection.emit("initializing");
      });
    connection.connect = jasmine.createSpy("connect");
    connection.close = jasmine.createSpy("abort");
    connection.state = undefined;

    return connection;
  };

  function getTransportMock(supported, connection) {
    var transport = new Object();

    transport.initialize = jasmine.createSpy("forceSecure");
    transport.createConnection = jasmine.createSpy("transport")
      .andReturn(connection || getConnectionMock());
    transport.isSupported = jasmine.createSpy("initialize")
      .andReturn(supported);

    return transport;
  };

  beforeEach(function() {
    this.callback = jasmine.createSpy();
  });

  it("should expose its name", function() {
    expect(new Pusher.TransportStrategy(null, {}).name).toEqual("transport");
  });

  it("should pass correct secure value for encrypted strategy", function() {
    var transport = getTransportMock(true);
    var strategy = new Pusher.TransportStrategy(transport, { key: "foo" });

    var encryptedStrategy = strategy.getEncrypted();
    encryptedStrategy.connect(this.callback);
    expect(transport.createConnection).toHaveBeenCalledWith("foo", {
      key: "foo",
      secure: true
    });
  });

  describe("when asked if it's supported", function() {
    it("should return true when transport is supported", function() {
      var strategy = new Pusher.TransportStrategy(getTransportMock(true));
      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false when transport is not supported", function() {
      var strategy = new Pusher.TransportStrategy(getTransportMock(false));
      expect(strategy.isSupported()).toBe(false);
    });
  });

  describe("on connection attempt", function() {
    it("should pass key and options to the transport", function() {
      var options = {
        key: "asdf",
        foo: "bar"
      };
      var transport = getTransportMock(true);
      var strategy = new Pusher.TransportStrategy(transport, options);

      strategy.connect(this.callback);
      expect(transport.createConnection).toHaveBeenCalledWith("asdf", options);
    });

    it("should emit open on success", function() {
      var connection = getConnectionMock();
      var transport = getTransportMock(true, connection);
      var strategy = new Pusher.TransportStrategy(transport, {});

      strategy.connect(this.callback);
      expect(connection.initialize).toHaveBeenCalled();
      expect(connection.connect).not.toHaveBeenCalled();

      connection.state = "initialized";
      connection.emit("initialized");
      expect(connection.connect).toHaveBeenCalled();

      connection.state = "open";
      connection.emit("open")
      expect(this.callback).toHaveBeenCalledWith(null, connection);
    });

    it("should emit error on a connection error", function() {
      var connection = getConnectionMock();
      var transport = getTransportMock(true, connection);
      var strategy = new Pusher.TransportStrategy(transport, {});

      strategy.connect(this.callback);
      connection.state = "initialized";
      connection.emit("initialized");

      connection.emit("error", 123);
      expect(this.callback).toHaveBeenCalledWith(123);
    });

    it("should emit error on connection closed", function() {
      var connection = getConnectionMock();
      var transport = getTransportMock(true, connection);
      var strategy = new Pusher.TransportStrategy(transport, {});

      strategy.connect(this.callback);
      connection.state = "initialized";
      connection.emit("initialized");

      connection.state = "closed";
      connection.emit("closed");
      expect(this.callback).toHaveBeenCalledWith("closed");
    });

    it("should allow reconnection", function() {
      var connection1 = getConnectionMock();
      var transport = getTransportMock(true, connection1);
      var strategy = new Pusher.TransportStrategy(transport, {});

      strategy.connect(this.callback);
      connection1.state = "initialized";
      connection1.emit("initialized");
      expect(connection1.connect).toHaveBeenCalled();

      connection1.state = "open";
      connection1.emit("open")
      expect(this.callback).toHaveBeenCalledWith(null, connection1);
      expect(this.callback.calls.length).toEqual(1);

      var connection2 = getConnectionMock();
      transport.createConnection = jasmine.createSpy("createConnection")
        .andReturn(connection2);

      strategy.connect(this.callback);
      connection2.state = "initialized";
      connection2.emit("initialized");
      expect(connection2.connect).toHaveBeenCalled();

      connection2.state = "open";
      connection2.emit("open")
      expect(this.callback).toHaveBeenCalledWith(null, connection2);
      expect(this.callback.calls.length).toEqual(2);
    });
  });

  describe("on aborting", function() {
    it("should close the connection when connecting", function() {
      var connection = getConnectionMock();
      var transport = getTransportMock(true, connection);
      var strategy = new Pusher.TransportStrategy(transport, {});

      var runner = strategy.connect(this.callback);

      connection.state = "initialized";
      connection.emit("initialized");
      connection.state = "connecting";
      connection.emit("connecting");

      runner.abort();

      expect(connection.close).toHaveBeenCalled();
    });

    it("should not close open connections", function() {
      var connection = getConnectionMock();
      var transport = getTransportMock(true, connection);
      var strategy = new Pusher.TransportStrategy(transport, {});

      var runner = strategy.connect(this.callback);

      connection.state = "initialized";
      connection.emit("initialized");
      connection.state = "connecting";
      connection.emit("connecting");
      connection.state = "open";
      connection.emit("open");

      runner.abort();

      expect(connection.close).not.toHaveBeenCalled();
    });
  });
});
