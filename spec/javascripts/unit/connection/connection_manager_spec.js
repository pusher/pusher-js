describe("ConnectionManager", function() {
  beforeEach(function() {
    var self = this;

    jasmine.Clock.useMock();

    this.connection = Pusher.Mocks.getConnection();
    this.strategy = Pusher.Mocks.getStrategy(true);
    this.timeline = Pusher.Mocks.getTimeline();
    this.timelineSender = Pusher.Mocks.getTimelineSender();

    spyOn(Pusher.Network, "isOnline").andReturn(true);

    this.managerOptions = {
      getStrategy: jasmine.createSpy("getStrategy")
        .andReturn(self.strategy),
      getTimeline: jasmine.createSpy("getTimeline")
        .andReturn(self.timeline),
      getTimelineSender: jasmine.createSpy("getTimelineSender")
        .andReturn(self.timelineSender),
      activityTimeout: 3456,
      pongTimeout: 2345,
      unavailableTimeout: 1234
    };
    this.manager = new Pusher.ConnectionManager("foo", this.managerOptions);
    this.manager.wrapTransport = jasmine.createSpy("wrapTransport")
      .andReturn(this.connection);

  });

  describe("on construction", function() {
    it("should pass a timeline to the strategy builder", function() {
      new Pusher.ConnectionManager("foo", {
        getStrategy: function(options) {
          expect(options.timeline).toBe(self.timeline);
          return self.strategy;
        },
        getTimeline: function(options) {
          return self.timeline;
        },
        activityTimeout: 3456,
        pongTimeout: 2345,
        unavailableTimeout: 1234
      });
    });

    it("should transition to initialized state", function() {
      expect(this.manager.state).toEqual("initialized");
    });
  });

  describe("on connect", function() {
    it("should pass key to strategy builder", function() {
      this.manager.connect();
      expect(this.manager.options.getStrategy.calls[0].args[0].key)
        .toEqual("foo");
    });

    it("should pass whether connection is encrypted to timeline", function() {
      var options = Pusher.Util.extend({}, this.managerOptions, {
        encrypted: true
      });
      var manager = new Pusher.ConnectionManager("foo", options);
      manager.connect();
      expect(options.getTimelineSender)
        .toHaveBeenCalledWith(this.timeline, { encrypted: true }, manager);
    });

    it("should initialize strategy and try to connect", function() {
      this.manager.connect();
      expect(this.strategy.connect).toHaveBeenCalled();
    });

    it("should transition to connecting", function() {
      var onConnecting = jasmine.createSpy("onConnecting");
      var onStateChange = jasmine.createSpy("onStateChange");
      this.manager.bind("connecting", onConnecting);
      this.manager.bind("state_change", onStateChange);

      this.manager.connect();

      expect(this.manager.state).toEqual("connecting");
      expect(onConnecting).toHaveBeenCalled();
      expect(onStateChange).toHaveBeenCalledWith({
        previous: "initialized",
        current: "connecting"
      });
    });

    it("should start sending timeline every minute", function() {
      this.timeline.isEmpty.andReturn(false);
      this.manager.connect();

      jasmine.Clock.tick(59999);
      expect(this.timelineSender.send.calls.length).toEqual(0);
      jasmine.Clock.tick(1);
      expect(this.timelineSender.send.calls.length).toEqual(1);
      jasmine.Clock.tick(60000);
      expect(this.timelineSender.send.calls.length).toEqual(2);
    });
  });

  describe("after successful connection attempt", function() {
    it("should transition to connected", function() {
      var onConnected = jasmine.createSpy("onConnected");
      this.manager.bind("connected", onConnected);

      this.manager.connect();
      this.strategy._callback(null, {});

      expect(onConnected).not.toHaveBeenCalled();
      this.connection.emit("connected", "123.456");

      expect(onConnected).toHaveBeenCalled();
      expect(this.manager.socket_id).toEqual("123.456");
    });

    it("should abort substrategy immediately", function() {
      this.manager.connect();
      expect(this.strategy._abort).not.toHaveBeenCalled();

      this.strategy._callback(null, {});
      expect(this.strategy._abort).toHaveBeenCalled();
    });

    it("should clear the unavailable timer", function() {
      this.manager.connect();
      this.strategy._callback(null, this.connection);
      this.connection.emit("connected");

      jasmine.Clock.tick(1500);
      // if unavailable timer was not cleared, state should be unavailable
      expect(this.manager.state).toEqual("connected");
    });

    it("should not try to connect again", function() {
      this.manager.connect();
      this.strategy._callback(null, {});

      expect(this.strategy.connect.calls.length).toEqual(1);
      this.manager.connect();
      expect(this.strategy.connect.calls.length).toEqual(1);
    });

    it("should send timeline", function() {
      expect(this.timelineSender.send).not.toHaveBeenCalled();
      this.manager.connect();
      this.strategy._callback(null, {});
      this.connection.emit("connected");
      expect(this.timelineSender.send).toHaveBeenCalled();
    });
  });

  describe("on send", function() {
    it("should pass data to the transport", function() {
      this.manager.connect();
      this.strategy._callback(null, {});
      this.connection.emit("connected", "123.456");
      expect(this.manager.send("howdy")).toBe(true);

      expect(this.connection.send).toHaveBeenCalledWith("howdy");
    });

    it("should not send data when not connected", function() {
      expect(this.manager.send("FALSE!")).toBe(false);
    });
  });

  describe("on disconnect", function() {
    it("should transition to disconnected", function() {
      var onDisconnected = jasmine.createSpy("onDisconnected");
      this.manager.bind("disconnected", onDisconnected);

      this.manager.connect();
      this.manager.disconnect();

      expect(onDisconnected).toHaveBeenCalled();
    });

    it("should close connection", function() {
      this.manager.connect();
      this.strategy._callback(null, {});
      this.manager.disconnect();

      expect(this.connection.close).toHaveBeenCalled();
    });

    it("should abort connection attempt", function() {
      this.manager.connect();
      this.manager.disconnect();

      expect(this.strategy._abort).toHaveBeenCalled();
    });

    it("should clear the unavailable timer and activity check", function() {
      this.manager.connect();
      this.strategy._callback(null, {});
      this.manager.disconnect();

      jasmine.Clock.tick(10000);
      expect(this.manager.state).toEqual("disconnected");
      expect(this.connection.send).not.toHaveBeenCalled();
      expect(this.connection.send_event).not.toHaveBeenCalled();
    });
  });

  describe("on lost connection", function() {
    it("should transition to disconnected then to connecting", function() {
      var self = this;

      this.manager.connect();
      this.strategy._callback(null, {});

      var onConnecting = jasmine.createSpy("onConnecting");
      var onDisconnected = jasmine.createSpy("onDisconnected")
        .andCallFake(function() {
          self.manager.bind("connecting", onConnecting);
        });
      this.manager.bind("disconnected", onDisconnected);

      this.connection.emit("closed");
      jasmine.Clock.tick(0);
      expect(onDisconnected).toHaveBeenCalled();
      expect(onConnecting).toHaveBeenCalled();
    });

    it("should clean up activity timer and abort strategy", function() {
      var self = this;

      this.manager.connect();
      this.strategy._callback(null, {});
      this.connection.emit("connected");
      expect(this.strategy._abort).toHaveBeenCalled();

      this.connection.emit("closed");
      jasmine.Clock.tick(0);

      jasmine.Clock.tick(10000);
      // there should be no messages (including ping) sent over the connection
      expect(this.connection.send).not.toHaveBeenCalled();
      expect(this.connection.send_event).not.toHaveBeenCalled();
    });

    it("should force secure and reconnect after receiving 'ssl_only' event", function() {
      var self = this;
      var encryptedStrategy = Pusher.Mocks.getStrategy(true);

      this.manager.connect();
      this.strategy._callback(null, {});

      this.managerOptions.getStrategy.andReturn(encryptedStrategy);
      this.connection.emit("ssl_only");

      jasmine.Clock.tick(0);

      expect(this.managerOptions.getTimelineSender)
        .toHaveBeenCalledWith(this.timeline, { encrypted: true }, this.manager);
      expect(this.managerOptions.getStrategy).toHaveBeenCalledWith({
        key: "foo",
        encrypted: true,
        timeline: this.timeline
      });

      expect(encryptedStrategy.connect).toHaveBeenCalled();
      expect(this.manager.state).toEqual("connecting");
    });

    it("should disconnect after receiving 'refused' event", function() {
      var self = this;

      this.manager.connect();
      this.strategy._callback(null, {});
      this.connection.emit("refused");

      expect(this.manager.state).toEqual("disconnected");
    });

    it("should reconnect immediately after receiving 'retry' event", function() {
      var self = this;

      this.manager.connect();
      this.strategy._callback(null, {});
      this.connection.emit("retry");

      jasmine.Clock.tick(0);
      expect(this.manager.state).toEqual("connecting");
    });

    it("should reconnect with a 1s delay after receiving 'backoff' event", function() {
      var self = this;

      this.manager.connect();
      this.strategy._callback(null, {});
      this.connection.emit("backoff");

      jasmine.Clock.tick(999);
      expect(this.strategy.connect.calls.length).toEqual(1);
      jasmine.Clock.tick(1);
      expect(this.strategy.connect.calls.length).toEqual(2);
    });
  });

  describe("on reconnect", function() {
    it("should use the same strategy to reconnect", function() {
      var onConnected = jasmine.createSpy("onConnected");
      this.manager.bind("connected", onConnected);

      this.manager.connect();

      expect(this.strategy.connect.calls.length).toEqual(1);

      this.strategy._callback(null, {});
      this.connection.emit("connected", "123.456");

      expect(onConnected.calls.length).toEqual(1);
      expect(this.manager.socket_id).toEqual("123.456");

      this.manager.disconnect();
      this.manager.connect();

      expect(this.strategy.connect.calls.length).toEqual(2);

      this.strategy._callback(null, {});
      this.connection.emit("connected", "666.999");

      expect(onConnected.calls.length).toEqual(2);
      expect(this.manager.socket_id).toEqual("666.999");
    });
  });

  describe("on unavailable timeout", function() {
    it("should fire the timer and transition to unavailable", function() {
      this.manager.connect();
      expect(this.manager.state).toEqual("connecting");

      var onUnavailable = jasmine.createSpy("onUnavailable");
      this.manager.bind("unavailable", onUnavailable);

      jasmine.Clock.tick(1233);
      expect(this.manager.state).toEqual("connecting");
      jasmine.Clock.tick(1);
      expect(this.manager.state).toEqual("unavailable");
      expect(onUnavailable).toHaveBeenCalled();
    });
  });

  describe("on activity timeout", function() {
    it("should send a pusher:ping event", function() {
      this.manager.connect();
      this.strategy._callback(null, {});
      this.connection.emit("connected", "666.999");

      jasmine.Clock.tick(3455);
      expect(this.connection.send_event).not.toHaveBeenCalled();

      jasmine.Clock.tick(1);
      expect(this.connection.send_event)
        .toHaveBeenCalledWith("pusher:ping", {}, undefined);

      jasmine.Clock.tick(2344);
      expect(this.connection.close).not.toHaveBeenCalled();

      this.connection.emit("pong");
      this.connection.emit("message", {
        event: "pusher:pong",
        data: {}
      });

      // pong received, connection should not get closed
      jasmine.Clock.tick(1000);
      expect(this.connection.close).not.toHaveBeenCalled();
    });

    it("should close the connection after pong timeout", function() {
      this.manager.connect();
      this.strategy._callback(null, {});
      this.connection.emit("connected", "666.999");

      jasmine.Clock.tick(3456);
      expect(this.connection.close).not.toHaveBeenCalled();
      jasmine.Clock.tick(2345);
      expect(this.connection.close).toHaveBeenCalled();
    });
  });

  describe("on ping", function() {
    it("should reply with a pusher:pong event", function() {
      this.manager.connect();
      this.strategy._callback(null, {});
      this.connection.emit("connected", "666.999");

      this.connection.emit("ping");
      expect(this.connection.send_event)
        .toHaveBeenCalledWith("pusher:pong", {}, undefined);
    });
  });

  describe("on network connection/disconnection", function() {
    it("should transition to unavailable before connecting and browser is offline", function() {
      Pusher.Network.isOnline.andReturn(false);

      this.manager.connect();
      expect(this.manager.state).toEqual("unavailable");
      expect(this.strategy.connect).not.toHaveBeenCalled();
    });

    it("should transition to unavailable when connecting and browser goes offline", function() {
      this.manager.connect();
      expect(this.manager.state).toEqual("connecting");

      Pusher.Network.isOnline.andReturn(false);
      Pusher.Network.emit("offline");

      expect(this.manager.state).toEqual("unavailable");
    });

    it("should transition to unavailable when connected and browser goes offline", function() {
      this.manager.connect();
      this.strategy.emit("open", {});

      Pusher.Network.isOnline.andReturn(false);
      Pusher.Network.emit("offline");

      expect(this.manager.state).toEqual("unavailable");
    });

    it("should try connecting when unavailable browser goes back online", function() {
      Pusher.Network.isOnline.andReturn(false);
      this.manager.connect();
      Pusher.Network.isOnline.andReturn(true);
      Pusher.Network.emit("online");

      expect(this.manager.state).toEqual("connecting");
      expect(this.strategy.connect).toHaveBeenCalled();
    });
  });

  describe("on strategy error", function() {
    it("should connect again using the same strategy", function() {
      this.manager.connect();
      expect(this.strategy.connect.calls.length).toEqual(1);

      this.strategy._callback(true);
      expect(this.strategy.connect.calls.length).toEqual(2);
      expect(this.manager.state).toEqual("connecting");
    });
  });

  describe("on connection error", function() {
    it("should emit an error", function() {
      var onError = jasmine.createSpy("onError");
      this.manager.bind("error", onError);

      this.manager.connect();
      this.strategy._callback(null, {});
      this.connection.emit("error", { boom: "boom" });

      expect(onError).toHaveBeenCalledWith({
        type: "WebSocketError",
        error: { boom: "boom" }
      });
    });
  });

  describe("with unsupported strategy", function() {
    it("should transition to failed on connect", function() {
      this.strategy.isSupported = jasmine.createSpy("isSupported")
        .andReturn(false);

      var onFailed = jasmine.createSpy("onFailed");
      this.manager.bind("failed", onFailed);

      this.manager.connect();
      expect(onFailed).toHaveBeenCalled();
    });
  });
});
