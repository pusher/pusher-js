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
        .andReturn(timelineSender),
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

  describe("#connect", function() {
    it("should pass the key to the strategy builder", function() {
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

  describe("before establishing a connection", function() {
    beforeEach(function() {
      manager.connect();
    });

    describe("#send", function() {
      it("should not send data", function() {
        expect(manager.send("FALSE!")).toBe(false);
      });
    });

    describe("#disconnect", function() {
      it("should transition to disconnected", function() {
        var onDisconnected = jasmine.createSpy("onDisconnected");
        manager.bind("disconnected", onDisconnected);

        manager.disconnect();

        expect(onDisconnected).toHaveBeenCalled();
      });

      it("should abort connection attempt", function() {
        manager.connect();
        manager.disconnect();

        expect(strategy._abort).toHaveBeenCalled();
      });

      it("should clear the unavailable timer", function() {
        manager.disconnect();

        jasmine.Clock.tick(10000);
        // if unavailable timer worked, it would transition into 'unavailable'
        expect(manager.state).toEqual("disconnected");
      });
    });

    describe("on unavailable timeout", function() {
      it("should fire the timer and transition to unavailable", function() {
        var onUnavailable = jasmine.createSpy("onUnavailable");
        manager.bind("unavailable", onUnavailable);

        jasmine.Clock.tick(1233);
        expect(manager.state).toEqual("connecting");
        jasmine.Clock.tick(1);
        expect(manager.state).toEqual("unavailable");
        expect(onUnavailable).toHaveBeenCalled();
      });
    });
  });

  describe("on handshake", function() {
    var handshake;

    beforeEach(function() {
      manager.connect();
    });

    describe("with 'ssl_only' action", function() {
      var encryptedStrategy;

      beforeEach(function() {
        encryptedStrategy = Pusher.Mocks.getStrategy(true);
        managerOptions.getStrategy.andReturn(encryptedStrategy);

        handshake = { action: "ssl_only" };
        strategy._callback(null, handshake);

        jasmine.Clock.tick(0);
      });

      it("should build an encrypted timeline sender", function() {
        expect(managerOptions.getTimelineSender)
          .toHaveBeenCalledWith(timeline, { encrypted: true }, manager);
      });

      it("should build an encrypted strategy", function() {
        expect(managerOptions.getStrategy).toHaveBeenCalledWith({
          key: "foo",
          encrypted: true,
          timeline: timeline
        });
      });

      it("should connect using the encrypted strategy", function() {
        expect(encryptedStrategy.connect).toHaveBeenCalled();
        expect(manager.state).toEqual("connecting");
      });

      it("should transition to 'connecting'", function() {
        expect(manager.state).toEqual("connecting");
      });
    });

    describe("with 'refused' action", function() {
      var handshake;

      beforeEach(function() {
        handshake = { action: "refused" };
        strategy._callback(null, handshake);
      });

      it("should transition to 'disconnected'", function() {
        expect(manager.state).toEqual("disconnected");
      });

      it("should not reconnect", function() {
        jasmine.Clock.tick(100000);
        expect(manager.state).toEqual("disconnected");
      });
    });

    describe("with 'retry' action", function() {
      var handshake;

      beforeEach(function() {
        handshake = { action: "retry" };
        strategy._callback(null, handshake);
      });

      it("should reconnect immediately", function() {
        jasmine.Clock.tick(0);
        expect(manager.state).toEqual("connecting");
      });
    });

    describe("with 'backoff' action", function() {
      var handshake;

      beforeEach(function() {
        handshake = { action: "backoff" };
        strategy._callback(null, handshake);
      });

      it("should reconnect after 1s", function() {
        jasmine.Clock.tick(999);
        expect(strategy.connect.calls.length).toEqual(1);
        jasmine.Clock.tick(1);
        expect(strategy.connect.calls.length).toEqual(2);
      });
    });
  });

  describe("after establishing a connection", function() {
    var handshake;
    var onConnected;

    beforeEach(function() {
      onConnected = jasmine.createSpy("onConnected");
      manager.bind("connected", onConnected);

      manager.connect();

      connection.id = "123.456";
      handshake = { action: "connected", connection: connection };
      strategy._callback(null, handshake);
    });

    it("should transition to connected", function() {
      expect(onConnected).toHaveBeenCalled();
    });

    it("should assign 'socket_id' to the manager", function() {
      expect(manager.socket_id).toEqual("123.456");
    });

    it("should abort substrategy immediately", function() {
      expect(strategy._abort).toHaveBeenCalled();
    });

    it("should clear the unavailable timer", function() {
      jasmine.Clock.tick(1500);
      // if unavailable timer was not cleared, state should be unavailable
      expect(manager.state).toEqual("connected");
    });

    it("should not try to connect again", function() {
      expect(strategy.connect.calls.length).toEqual(1);
      manager.connect();
      expect(strategy.connect.calls.length).toEqual(1);
    });

    it("should send timeline when sender is supplied", function() {
      expect(timelineSender.send).toHaveBeenCalled();
    });

    describe("#send", function() {
      it("should pass data to the connection", function() {
        expect(manager.send("howdy")).toBe(true);
        expect(connection.send).toHaveBeenCalledWith("howdy");
      });
    });

    describe("#disconnect", function() {
      it("should transition to disconnected", function() {
        var onDisconnected = jasmine.createSpy("onDisconnected");
        manager.bind("disconnected", onDisconnected);

        manager.disconnect();

        expect(onDisconnected).toHaveBeenCalled();
      });

      it("should close the connection", function() {
        manager.disconnect();

        expect(connection.close).toHaveBeenCalled();
      });

      it("should clear the activity check", function() {
        manager.disconnect();

        jasmine.Clock.tick(10000);
        // if activity check worked, it would send a ping message
        expect(connection.send).not.toHaveBeenCalled();
        expect(connection.send_event).not.toHaveBeenCalled();
      });

      it("should stop emitting received messages", function() {
        var onMessage = jasmine.createSpy("onMessage");
        manager.bind("message", onMessage);

        manager.disconnect();

        connection.emit("message", {});
        expect(onMessage).not.toHaveBeenCalled();
      });
    });

    describe("and losing the connection", function() {
      var onConnecting, onDisconnected;

      beforeEach(function() {
        onConnecting = jasmine.createSpy("onConnecting");
        onDisconnected = jasmine.createSpy("onDisconnected");
        manager.bind("connecting", onConnecting);
        manager.bind("disconnected", onDisconnected);

        connection.emit("closed");
      });

      it("should emit 'disconnected' after 1s", function() {
        jasmine.Clock.tick(999);
        expect(onDisconnected).not.toHaveBeenCalled();

        jasmine.Clock.tick(1);
        expect(onDisconnected).toHaveBeenCalled();
      });

      it("should transition to 'connecting' after 1s", function() {
        jasmine.Clock.tick(999);
        expect(onConnecting).not.toHaveBeenCalled();

        jasmine.Clock.tick(1);
        expect(onConnecting).toHaveBeenCalled();
        expect(manager.state).toEqual("connecting");
      });

      it("should clean up the activity check", function() {
        jasmine.Clock.tick(10000);
        // if activity check worked, it would send a ping message
        expect(connection.send).not.toHaveBeenCalled();
        expect(connection.send_event).not.toHaveBeenCalled();
      });
    });

    describe("while reconnecting", function() {
      it("should re-use the strategy", function() {
        expect(strategy.connect.calls.length).toEqual(1);

        manager.disconnect();
        manager.connect();

        expect(strategy.connect.calls.length).toEqual(2);
      });
    });

    describe("on activity timeout", function() {
      it("should send a pusher:ping event", function() {
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
        jasmine.Clock.tick(3456);
        expect(connection.close).not.toHaveBeenCalled();
        jasmine.Clock.tick(2345);
        expect(connection.close).toHaveBeenCalled();
      });
    });

    describe("on connection error", function() {
      it("should emit an error", function() {
        var onError = jasmine.createSpy("onError");
        manager.bind("error", onError);

        connection.emit("error", { boom: "boom" });

        expect(onError).toHaveBeenCalledWith({
          type: "WebSocketError",
          error: { boom: "boom" }
        });
      });
    });

    describe("on ping", function() {
      it("should reply with a pusher:pong event", function() {
        connection.emit("ping");
        expect(connection.send_event)
          .toHaveBeenCalledWith("pusher:pong", {}, undefined);
      });
    });

    describe("on ping request", function() {
      it("should send a pusher:ping event", function() {
        connection.emit("ping_request");
        expect(connection.send_event)
          .toHaveBeenCalledWith("pusher:ping", {}, undefined);
      });
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
