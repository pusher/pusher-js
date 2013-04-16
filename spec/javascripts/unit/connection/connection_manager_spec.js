describe("ConnectionManager", function() {
  var connection, strategy, timeline, timelineSender;
  var managerOptions, manager;

  beforeEach(function() {
    jasmine.Clock.useMock();

    connection = Pusher.Mocks.getConnection();
    strategy = Pusher.Mocks.getStrategy(true);
    timeline = Pusher.Mocks.getTimeline();
    timelineSender = Pusher.Mocks.getTimelineSender();

    spyOn(Pusher.Network, "isOnline").andReturn(true);

    managerOptions = {
      getStrategy: jasmine.createSpy("getStrategy").andReturn(strategy),
      getTimeline: jasmine.createSpy("getTimeline").andReturn(timeline),
      getTimelineSender: jasmine.createSpy("getTimelineSender")
        .andReturn(null),
      activityTimeout: 3456,
      pongTimeout: 2345,
      unavailableTimeout: 1234
    };
    manager = new Pusher.ConnectionManager("foo", managerOptions);
  });

  describe("on construction", function() {
    it("should pass a timeline to the strategy builder", function() {
      new Pusher.ConnectionManager("foo", {
        getStrategy: function(options) {
          expect(options.timeline).toBe(timeline);
          return strategy;
        },
        getTimeline: function(options) {
          return timeline;
        },
        activityTimeout: 3456,
        pongTimeout: 2345,
        unavailableTimeout: 1234
      });
    });

    it("should transition to initialized state", function() {
      expect(manager.state).toEqual("initialized");
    });
  });

  describe("on connect", function() {
    it("should pass key to strategy builder", function() {
      manager.connect();
      expect(manager.options.getStrategy.calls[0].args[0].key)
        .toEqual("foo");
    });

    it("should pass whether connection is encrypted to timeline", function() {
      var options = Pusher.Util.extend({}, managerOptions, {
        encrypted: true
      });
      var manager = new Pusher.ConnectionManager("foo", options);
      manager.connect();
      expect(options.getTimelineSender)
        .toHaveBeenCalledWith(timeline, { encrypted: true }, manager);
    });

    it("should initialize strategy and try to connect", function() {
      manager.connect();
      expect(strategy.connect).toHaveBeenCalled();
    });

    it("should transition to connecting", function() {
      var onConnecting = jasmine.createSpy("onConnecting");
      var onStateChange = jasmine.createSpy("onStateChange");
      manager.bind("connecting", onConnecting);
      manager.bind("state_change", onStateChange);

      manager.connect();

      expect(manager.state).toEqual("connecting");
      expect(onConnecting).toHaveBeenCalled();
      expect(onStateChange).toHaveBeenCalledWith({
        previous: "initialized",
        current: "connecting"
      });
    });

    it("should start sending timeline every minute when sender is supplied", function() {
      var options = Pusher.Util.extend({}, managerOptions, {
        getTimelineSender: jasmine.createSpy("getTimelineSender")
          .andReturn(timelineSender)
      });
      var manager = new Pusher.ConnectionManager("foo", options);

      timeline.isEmpty.andReturn(false);
      manager.connect();

      jasmine.Clock.tick(59999);
      expect(timelineSender.send.calls.length).toEqual(0);
      jasmine.Clock.tick(1);
      expect(timelineSender.send.calls.length).toEqual(1);
      jasmine.Clock.tick(60000);
      expect(timelineSender.send.calls.length).toEqual(2);
    });
  });

  describe("after successful connection attempt", function() {
    it("should transition to connected", function() {
      var onConnected = jasmine.createSpy("onConnected");
      manager.bind("connected", onConnected);

      manager.connect();
      strategy._callback(null, connection);

      expect(onConnected).not.toHaveBeenCalled();
      connection.emit("connected", "123.456");

      expect(onConnected).toHaveBeenCalled();
      expect(manager.socket_id).toEqual("123.456");
    });

    it("should abort substrategy immediately", function() {
      manager.connect();
      expect(strategy._abort).not.toHaveBeenCalled();

      strategy._callback(null, connection);
      expect(strategy._abort).toHaveBeenCalled();
    });

    it("should clear the unavailable timer", function() {
      manager.connect();
      strategy._callback(null, connection);
      connection.emit("connected");

      jasmine.Clock.tick(1500);
      // if unavailable timer was not cleared, state should be unavailable
      expect(manager.state).toEqual("connected");
    });

    it("should not try to connect again", function() {
      manager.connect();
      strategy._callback(null, connection);

      expect(strategy.connect.calls.length).toEqual(1);
      manager.connect();
      expect(strategy.connect.calls.length).toEqual(1);
    });

    it("should send timeline when sender is supplied", function() {
      var options = Pusher.Util.extend({}, managerOptions, {
        getTimelineSender: jasmine.createSpy("getTimelineSender")
          .andReturn(timelineSender)
      });
      var manager = new Pusher.ConnectionManager("foo", options);

      expect(timelineSender.send).not.toHaveBeenCalled();
      manager.connect();
      strategy._callback(null, connection);
      connection.emit("connected");
      expect(timelineSender.send).toHaveBeenCalled();
    });
  });

  describe("on send", function() {
    it("should pass data to the connection", function() {
      manager.connect();
      strategy._callback(null, connection);
      connection.emit("connected", "123.456");
      expect(manager.send("howdy")).toBe(true);

      expect(connection.send).toHaveBeenCalledWith("howdy");
    });

    it("should not send data when not connected", function() {
      expect(manager.send("FALSE!")).toBe(false);
    });
  });

  describe("on disconnect", function() {
    it("should transition to disconnected", function() {
      var onDisconnected = jasmine.createSpy("onDisconnected");
      manager.bind("disconnected", onDisconnected);

      manager.connect();
      manager.disconnect();

      expect(onDisconnected).toHaveBeenCalled();
    });

    it("should close connection", function() {
      manager.connect();
      strategy._callback(null, connection);
      manager.disconnect();

      expect(connection.close).toHaveBeenCalled();
    });

    it("should abort connection attempt", function() {
      manager.connect();
      manager.disconnect();

      expect(strategy._abort).toHaveBeenCalled();
    });

    it("should clear the unavailable timer and activity check", function() {
      manager.connect();
      strategy._callback(null, connection);
      manager.disconnect();

      jasmine.Clock.tick(10000);
      expect(manager.state).toEqual("disconnected");
      expect(connection.send).not.toHaveBeenCalled();
      expect(connection.send_event).not.toHaveBeenCalled();
    });

    it("should stop emitting received messages", function() {
      var onMessage = jasmine.createSpy("onMessage");
      manager.bind("message", onMessage);

      manager.connect();
      strategy._callback(null, connection);
      manager.disconnect();

      connection.emit("message", {});
      expect(onMessage).not.toHaveBeenCalled();
    });
  });

  describe("on lost connection", function() {
    it("should transition to disconnected then to connecting after 1s", function() {
      manager.connect();
      strategy._callback(null, connection);

      var onConnecting = jasmine.createSpy("onConnecting");
      var onDisconnected = jasmine.createSpy("onDisconnected")
        .andCallFake(function() {
          manager.bind("connecting", onConnecting);
        });
      manager.bind("disconnected", onDisconnected);

      connection.emit("closed");

      jasmine.Clock.tick(999);
      expect(onDisconnected).not.toHaveBeenCalled();
      expect(onConnecting).not.toHaveBeenCalled();

      jasmine.Clock.tick(1);
      expect(onDisconnected).toHaveBeenCalled();
      expect(onConnecting).toHaveBeenCalled();
    });

    it("should clean up activity timer and abort strategy", function() {
      manager.connect();
      strategy._callback(null, connection);
      connection.emit("connected");
      expect(strategy._abort).toHaveBeenCalled();

      connection.emit("closed");
      jasmine.Clock.tick(0);

      jasmine.Clock.tick(10000);
      // there should be no messages (including ping) sent over the connection
      expect(connection.send).not.toHaveBeenCalled();
      expect(connection.send_event).not.toHaveBeenCalled();
    });

    it("should force secure and reconnect after receiving 'ssl_only' event", function() {
      var encryptedStrategy = Pusher.Mocks.getStrategy(true);

      manager.connect();
      strategy._callback(null, connection);

      managerOptions.getStrategy.andReturn(encryptedStrategy);
      connection.emit("ssl_only");

      jasmine.Clock.tick(0);

      expect(managerOptions.getTimelineSender)
        .toHaveBeenCalledWith(timeline, { encrypted: true }, manager);
      expect(managerOptions.getStrategy).toHaveBeenCalledWith({
        key: "foo",
        encrypted: true,
        timeline: timeline
      });

      expect(encryptedStrategy.connect).toHaveBeenCalled();
      expect(manager.state).toEqual("connecting");
    });

    it("should disconnect after receiving 'refused' event", function() {
      manager.connect();
      strategy._callback(null, connection);
      connection.emit("refused");

      expect(manager.state).toEqual("disconnected");
    });

    it("should reconnect immediately after receiving 'retry' event", function() {
      manager.connect();
      strategy._callback(null, connection);
      connection.emit("retry");

      jasmine.Clock.tick(0);
      expect(manager.state).toEqual("connecting");
    });

    it("should reconnect with a 1s delay after receiving 'backoff' event", function() {
      manager.connect();
      strategy._callback(null, connection);
      connection.emit("backoff");

      jasmine.Clock.tick(999);
      expect(strategy.connect.calls.length).toEqual(1);
      jasmine.Clock.tick(1);
      expect(strategy.connect.calls.length).toEqual(2);
    });
  });

  describe("on reconnect", function() {
    it("should use the same strategy to reconnect", function() {
      var onConnected = jasmine.createSpy("onConnected");
      manager.bind("connected", onConnected);

      manager.connect();

      expect(strategy.connect.calls.length).toEqual(1);

      strategy._callback(null, connection);
      connection.emit("connected", "123.456");

      expect(onConnected.calls.length).toEqual(1);
      expect(manager.socket_id).toEqual("123.456");

      manager.disconnect();
      manager.connect();

      expect(strategy.connect.calls.length).toEqual(2);

      strategy._callback(null, connection);
      connection.emit("connected", "666.999");

      expect(onConnected.calls.length).toEqual(2);
      expect(manager.socket_id).toEqual("666.999");
    });
  });

  describe("on unavailable timeout", function() {
    it("should fire the timer and transition to unavailable", function() {
      manager.connect();
      expect(manager.state).toEqual("connecting");

      var onUnavailable = jasmine.createSpy("onUnavailable");
      manager.bind("unavailable", onUnavailable);

      jasmine.Clock.tick(1233);
      expect(manager.state).toEqual("connecting");
      jasmine.Clock.tick(1);
      expect(manager.state).toEqual("unavailable");
      expect(onUnavailable).toHaveBeenCalled();
    });
  });

  describe("on activity timeout", function() {
    it("should send a pusher:ping event", function() {
      manager.connect();
      strategy._callback(null, connection);
      connection.emit("connected", "666.999");

      jasmine.Clock.tick(3455);
      expect(connection.send_event).not.toHaveBeenCalled();

      jasmine.Clock.tick(1);
      expect(connection.send_event)
        .toHaveBeenCalledWith("pusher:ping", {}, undefined);

      jasmine.Clock.tick(2344);
      expect(connection.close).not.toHaveBeenCalled();

      connection.emit("pong");
      connection.emit("message", {
        event: "pusher:pong",
        data: {}
      });

      // pong received, connection should not get closed
      jasmine.Clock.tick(1000);
      expect(connection.close).not.toHaveBeenCalled();
    });

    it("should close the connection after pong timeout", function() {
      manager.connect();
      strategy._callback(null, connection);
      connection.emit("connected", "666.999");

      jasmine.Clock.tick(3456);
      expect(connection.close).not.toHaveBeenCalled();
      jasmine.Clock.tick(2345);
      expect(connection.close).toHaveBeenCalled();
    });
  });

  describe("on ping", function() {
    it("should reply with a pusher:pong event", function() {
      manager.connect();
      strategy._callback(null, connection);
      connection.emit("connected", "666.999");

      connection.emit("ping");
      expect(connection.send_event)
        .toHaveBeenCalledWith("pusher:pong", {}, undefined);
    });
  });

  describe("on ping request", function() {
    it("should send a pusher:ping event", function() {
      manager.connect();
      strategy._callback(null, connection);
      connection.emit("connected", "666.999");

      connection.emit("ping_request");
      expect(connection.send_event)
        .toHaveBeenCalledWith("pusher:ping", {}, undefined);
    });
  });

  describe("on network connection/disconnection", function() {
    it("should transition to unavailable before connecting and browser is offline", function() {
      Pusher.Network.isOnline.andReturn(false);

      manager.connect();
      expect(manager.state).toEqual("unavailable");
      expect(strategy.connect).not.toHaveBeenCalled();
    });

    it("should transition to unavailable when connecting and browser goes offline", function() {
      manager.connect();
      expect(manager.state).toEqual("connecting");

      Pusher.Network.isOnline.andReturn(false);
      Pusher.Network.emit("offline");

      expect(manager.state).toEqual("unavailable");
    });

    it("should transition to unavailable when connected and browser goes offline", function() {
      manager.connect();
      strategy.emit("open", {});

      Pusher.Network.isOnline.andReturn(false);
      Pusher.Network.emit("offline");

      expect(manager.state).toEqual("unavailable");
    });

    it("should try connecting when unavailable browser goes back online", function() {
      Pusher.Network.isOnline.andReturn(false);
      manager.connect();
      Pusher.Network.isOnline.andReturn(true);
      Pusher.Network.emit("online");

      expect(manager.state).toEqual("connecting");
      expect(strategy.connect).toHaveBeenCalled();
    });
  });

  describe("on strategy error", function() {
    it("should connect again using the same strategy", function() {
      manager.connect();
      expect(strategy.connect.calls.length).toEqual(1);

      strategy._callback(true);
      expect(strategy.connect.calls.length).toEqual(2);
      expect(manager.state).toEqual("connecting");
    });
  });

  describe("on connection error", function() {
    it("should emit an error", function() {
      var onError = jasmine.createSpy("onError");
      manager.bind("error", onError);

      manager.connect();
      strategy._callback(null, connection);
      connection.emit("error", { boom: "boom" });

      expect(onError).toHaveBeenCalledWith({
        type: "WebSocketError",
        error: { boom: "boom" }
      });
    });
  });

  describe("with unsupported strategy", function() {
    it("should transition to failed on connect", function() {
      strategy.isSupported = jasmine.createSpy("isSupported")
        .andReturn(false);

      var onFailed = jasmine.createSpy("onFailed");
      manager.bind("failed", onFailed);

      manager.connect();
      expect(onFailed).toHaveBeenCalled();
    });
  });
});
