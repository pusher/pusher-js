describe("TransportStrategy", function() {
  function getConnectionMock() {
    var connection = new Pusher.EventsDispatcher();

    connection.initialize = jasmine.createSpy("initialize");
    connection.connect = jasmine.createSpy("connect");
    connection.close = jasmine.createSpy("abort");
    connection.state = undefined;

    return connection;
  };

  function getTransportMock(supported, connection) {
    var transport = new Object();

    transport.createConnection = jasmine.createSpy("transport")
      .andReturn(connection || getConnectionMock());
    transport.isSupported = jasmine.createSpy("initialize")
      .andReturn(supported);

    return transport;
  };

  it("should expose its name", function() {
    expect(new Pusher.TransportStrategy(null).name).toEqual("transport");
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

  describe("on initialization", function() {
    it("should pass key and options to the transport", function() {
      var options = {
        key: "asdf",
        foo: "bar"
      };
      var transport = getTransportMock(true);
      var strategy = new Pusher.TransportStrategy(transport, options);

      strategy.initialize();
      expect(transport.createConnection).toHaveBeenCalledWith("asdf", options);
    });

    it("should delegate initialization to the transport immediately", function() {
      var connection = getConnectionMock();
      var transport = getTransportMock(true, connection);
      var strategy = new Pusher.TransportStrategy(transport);

      strategy.initialize();

      expect(transport.createConnection).toHaveBeenCalled();
      expect(connection.initialize).toHaveBeenCalled();
    });
  });

  describe("on connection attempt", function() {
    it("should emit open on success", function() {
      var connection = getConnectionMock();
      var transport = getTransportMock(true, connection);
      var strategy = new Pusher.TransportStrategy(transport);

      var openCallback = jasmine.createSpy("openCallback");
      strategy.bind("open", openCallback);

      strategy.initialize();

      connection.state = "initialized";
      connection.emit("initialized");

      strategy.connect();
      expect(connection.connect).toHaveBeenCalled();

      connection.state = "open";
      connection.emit("open")
      expect(openCallback).toHaveBeenCalledWith(connection);
    });

    it("should wait for connection to initialize", function() {
      var connection = getConnectionMock();
      var transport = getTransportMock(true, connection);
      var strategy = new Pusher.TransportStrategy(transport);

      strategy.initialize();
      connection.state = "initializing";
      connection.emit("initializing");

      strategy.connect();
      expect(connection.connect).not.toHaveBeenCalled();

      connection.state = "initialized";
      connection.emit("initialized");

      expect(connection.connect).toHaveBeenCalled();
    });

    it("should not allow connecting before initialization", function() {
      var transport = getTransportMock(true);
      var strategy = new Pusher.TransportStrategy(transport);

      strategy.connect();
      expect(transport.createConnection).not.toHaveBeenCalled();
    });

    it("should allow one attempt at once", function() {
      var connection = getConnectionMock();
      var transport = getTransportMock(true, connection);
      var strategy = new Pusher.TransportStrategy(transport);

      strategy.initialize();

      connection.state = "initialized";
      connection.emit("initialized");

      expect(strategy.connect()).toBe(true);

      connection.state = "connecting";
      connection.emit("connecting");

      expect(strategy.connect()).toBe(false);
    });

    it("should emit error on a connection error", function() {
      var connection = getConnectionMock();
      var transport = getTransportMock(true, connection);
      var strategy = new Pusher.TransportStrategy(transport);

      var errorCallback = jasmine.createSpy("errorCallback");
      strategy.bind("error", errorCallback);

      strategy.initialize();
      connection.state = "initialized";
      connection.emit("initialized");
      strategy.connect();

      connection.emit("error", 123);
      expect(errorCallback).toHaveBeenCalledWith(123);
    });

    it("should emit error on a connection error", function() {
      var connection = getConnectionMock();
      var transport = getTransportMock(true, connection);
      var strategy = new Pusher.TransportStrategy(transport);

      var errorCallback = jasmine.createSpy("errorCallback");
      strategy.bind("error", errorCallback);

      strategy.initialize();
      connection.state = "initialized";
      connection.emit("initialized");
      strategy.connect();

      connection.emit("error", 123);
      expect(errorCallback).toHaveBeenCalledWith(123);
    });

    it("should emit error on connection closed", function() {
      var connection = getConnectionMock();
      var transport = getTransportMock(true, connection);
      var strategy = new Pusher.TransportStrategy(transport);

      var errorCallback = jasmine.createSpy("errorCallback");
      strategy.bind("error", errorCallback);

      strategy.initialize();
      connection.state = "initialized";
      connection.emit("initialized");
      strategy.connect();

      connection.state = "closed";
      connection.emit("closed");
      expect(errorCallback).toHaveBeenCalledWith("closed");
    });

    it("should allow reinitialization and reconnection", function() {
      var connection = getConnectionMock();
      var transport = getTransportMock(true, connection);
      var strategy = new Pusher.TransportStrategy(transport);

      var openCallback = jasmine.createSpy("openCallback");
      strategy.bind("open", openCallback);

      strategy.initialize();

      connection.state = "initialized";
      connection.emit("initialized");

      strategy.connect();
      expect(connection.connect).toHaveBeenCalled();

      connection.state = "open";
      connection.emit("open")
      expect(openCallback).toHaveBeenCalledWith(connection);

      var connection2 = getConnectionMock();
      transport.createConnection = jasmine.createSpy("createConnection")
        .andReturn(connection2);

      strategy.initialize();

      connection2.state = "initialized";
      connection2.emit("initialized");

      strategy.connect();
      expect(connection2.connect).toHaveBeenCalled();

      connection2.state = "open";
      connection2.emit("open")

      expect(openCallback.calls.length).toEqual(2);
      expect(openCallback).toHaveBeenCalledWith(connection2);
    });
  });

  describe("on aborting", function() {
    it("should close the connection when connecting", function() {
      var connection = getConnectionMock();
      var transport = getTransportMock(true, connection);
      var strategy = new Pusher.TransportStrategy(transport);

      strategy.initialize();
      connection.state = "initialized";
      connection.emit("initialized");
      strategy.connect();

      connection.state = "connecting";
      connection.emit("connecting");

      expect(strategy.abort()).toBe(true);

      expect(connection.close).toHaveBeenCalledWith();
    });

    it("should not allow aborting when not initialized", function() {
      var connection = getConnectionMock();
      var transport = getTransportMock(true, connection);
      var strategy = new Pusher.TransportStrategy(transport);

      expect(strategy.abort()).toBe(false);
    });
  });
});
