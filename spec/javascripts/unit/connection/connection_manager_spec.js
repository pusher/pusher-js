describe("ConnectionManager", function() {
  beforeEach(function() {
    var self = this;

    this.connection = Pusher.Mocks.getConnection();
    this.strategy = Pusher.Mocks.getStrategy(true);

    spyOn(Pusher.StrategyBuilder, "build").andReturn(this.strategy);
    spyOn(Pusher.NetInfo, "isOnline").andReturn(true);
    spyOn(window, "setTimeout").andReturn(666);
    spyOn(window, "clearTimeout");

    this.manager = new Pusher.ConnectionManager("foo", {
      activityTimeout: 111,
      pongTimeout: 222,
      unavailableTimeout: 333
    });
    this.manager.wrapTransport = jasmine.createSpy("wrapTransport")
      .andReturn(this.connection);
  });

  describe("on initialize", function() {
    it("should transition to initialized state", function() {
      expect(this.manager.state).toEqual("initialized");
    });

    it("should pass key to strategy builder", function() {
      expect(Pusher.StrategyBuilder.build.calls[0].args[0].key)
        .toEqual("foo");
    });
  });

  describe("on connect", function() {
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

    it("should set the unavailable timer", function() {
      this.manager.connect();
      expect(setTimeout).toHaveBeenCalledWith(jasmine.any(Function), 333);
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
      setTimeout.andReturn(123);

      this.manager.connect();
      this.strategy._callback(null, {});

      expect(clearTimeout).toHaveBeenCalledWith(123);
    });

    it("should not try to connect again", function() {
      this.manager.connect();
      this.strategy._callback(null, {});

      expect(this.strategy.connect.calls.length).toEqual(1);
      this.manager.connect();
      expect(this.strategy.connect.calls.length).toEqual(1);
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

      expect(clearTimeout.calls.length).toEqual(2);
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

      expect(onDisconnected).toHaveBeenCalled();
      expect(onConnecting).toHaveBeenCalled();
    });

    it("should clean up timers and abort strategy", function() {
      var self = this;

      this.manager.connect();
      this.strategy._callback(null, {});
      // unavailable timer should be cleared here
      expect(clearTimeout.calls.length).toEqual(1);

      this.connection.emit("closed");

      expect(this.strategy._abort).toHaveBeenCalled();
      // activity check should be cleared here
      // unavailable timer was cleared when connection was open
      expect(clearTimeout.calls.length).toEqual(2);
    });

    it("should force secure and reconnect after receiving 'ssl_only' event", function() {
      var self = this;

      var encryptedStrategy = new Pusher.EventsDispatcher();
      encryptedStrategy.isSupported = jasmine.createSpy("isSupported")
        .andReturn(true);
      encryptedStrategy.connect = jasmine.createSpy("connect")
        .andCallFake(function(callback) {
          return { abort: function() {} };
        });
      this.strategy.getEncrypted = jasmine.createSpy("getEncrypted")
        .andReturn(encryptedStrategy);

      this.manager.connect();
      this.strategy._callback(null, {});
      this.connection.emit("ssl_only");

      expect(this.strategy.getEncrypted).toHaveBeenCalled();
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

      expect(this.manager.state).toEqual("connecting");
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

      setTimeout.calls[0].args[0].call(window);
      expect(this.manager.state).toEqual("unavailable");
      expect(onUnavailable).toHaveBeenCalled();
    });
  });

  describe("on activity timeout", function() {
    it("should send a pusher:ping event", function() {
      this.manager.connect();
      this.strategy._callback(null, {});
      this.connection.emit("connected", "666.999");

      // on connection open and on pusher:connection_established
      expect(setTimeout.calls.length).toEqual(3);
      expect(clearTimeout.calls.length).toEqual(2);
      // call the activity timer
      setTimeout.calls[2].args[0].call(window);

      expect(this.connection.send_event)
        .toHaveBeenCalledWith("pusher:ping", {}, undefined);
      // set the pong timeout
      expect(setTimeout.calls.length).toEqual(4);
      expect(clearTimeout.calls.length).toEqual(2);

      this.connection.emit("pong");
      this.connection.emit("message", {
        event: "pusher:pong",
        data: {}
      });
      // clear the pong timeout
      expect(clearTimeout.calls.length).toEqual(3);
      // set the new activity timeout
      expect(setTimeout.calls.length).toEqual(5);
    });

    it("should close the connection on timeout", function() {
      this.manager.connect();
      this.strategy._callback(null, {});

      setTimeout.calls[1].args[0].call(window);

      expect(this.connection.close).not.toHaveBeenCalled();
      setTimeout.calls[2].args[0].call(window);
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
      Pusher.NetInfo.isOnline.andReturn(false);

      this.manager.connect();
      expect(this.manager.state).toEqual("unavailable");
      expect(this.strategy.connect).not.toHaveBeenCalled();
    });

    it("should transition to unavailable when connecting and browser goes offline", function() {
      this.manager.connect();
      expect(this.manager.state).toEqual("connecting");

      Pusher.NetInfo.isOnline.andReturn(false);
      Pusher.NetInfo.emit("offline");

      expect(this.manager.state).toEqual("unavailable");
    });

    it("should transition to unavailable when connected and browser goes offline", function() {
      this.manager.connect();
      this.strategy.emit("open", {});

      Pusher.NetInfo.isOnline.andReturn(false);
      Pusher.NetInfo.emit("offline");

      expect(this.manager.state).toEqual("unavailable");
    });

    it("should try connecting when unavailable browser goes back online", function() {
      Pusher.NetInfo.isOnline.andReturn(false);
      this.manager.connect();
      Pusher.NetInfo.isOnline.andReturn(true);
      Pusher.NetInfo.emit("online");

      expect(this.manager.state).toEqual("connecting");
      expect(this.strategy.connect).toHaveBeenCalled();
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
