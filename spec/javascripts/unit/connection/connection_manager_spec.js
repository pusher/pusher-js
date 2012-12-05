describe("ConnectionManager", function() {
  beforeEach(function() {
    var self = this;

    this.transport = new Object();

    this.connection = new Pusher.EventsDispatcher();
    this.connection.supportsPing = jasmine.createSpy("supportsPing");
    this.connection.send = jasmine.createSpy("send")
      .andReturn(true);
    this.connection.send_event = jasmine.createSpy("send_event")
      .andReturn(true);
    this.connection.close = jasmine.createSpy("close");

    this.strategy = new Pusher.EventsDispatcher();

    this.strategy.forceSecure = jasmine.createSpy("forceSecure");
    this.strategy.isSupported = jasmine.createSpy("isSupported")
      .andReturn(true);
    this.strategy.initialize = jasmine.createSpy("initialize");
    this.strategy.connect = jasmine.createSpy("connect");
    this.strategy.abort = jasmine.createSpy("abort");

    spyOn(Pusher.StrategyBuilder, "build").andReturn(this.strategy);
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

  describe("on initialization", function() {
    it("should transition to initialized state", function() {
      expect(this.manager.state).toEqual("initialized");
    });

    it("should pass the key to the strategy builder", function() {
      expect(Pusher.StrategyBuilder.build.calls[0].args[0].key)
        .toEqual("foo");
    });
  });

  describe("on connecting", function() {
    it("should initialize strategy and try to connect", function() {
      this.manager.connect();
      expect(this.strategy.initialize).toHaveBeenCalled();
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
      this.strategy.emit("open", this.transport);

      expect(onConnected).not.toHaveBeenCalled();
      this.connection.emit("connected", "123.456");

      expect(onConnected).toHaveBeenCalled();
      expect(this.manager.socket_id).toEqual("123.456");
    });

    it("should abort substrategy immediately", function() {
      this.manager.connect();
      expect(this.strategy.abort).not.toHaveBeenCalled();

      this.strategy.emit("open", this.transport);
      expect(this.strategy.abort).toHaveBeenCalled();
    });

    it("should clear the unavailable timer", function() {
      setTimeout.andReturn(123);

      this.manager.connect();
      this.strategy.emit("open", this.transport);

      expect(clearTimeout).toHaveBeenCalledWith(123);
    });

    it("should not try to connect again", function() {
      this.manager.connect();
      this.strategy.emit("open", this.transport);

      expect(this.strategy.initialize.calls.length).toEqual(1);
      expect(this.strategy.connect.calls.length).toEqual(1);

      this.manager.connect();

      expect(this.strategy.initialize.calls.length).toEqual(1);
      expect(this.strategy.connect.calls.length).toEqual(1);
    });
  });

  describe("when sending messages", function() {
    it("should pass data to the transport", function() {
      this.manager.connect();
      this.strategy.emit("open", this.transport);
      this.connection.emit("connected", "123.456");
      expect(this.manager.send("howdy")).toBe(true);

      expect(this.connection.send).toHaveBeenCalledWith("howdy");
    });


    it("should not send data when not connected", function() {
      expect(this.manager.send("FALSE!")).toBe(false);
    });
  });

  describe("on requested disconnection", function() {
    it("should transition to disconnected", function() {
      var onDisconnected = jasmine.createSpy("onDisconnected");
      this.manager.bind("disconnected", onDisconnected);

      this.manager.connect();
      this.manager.disconnect();

      expect(onDisconnected).toHaveBeenCalled();
    });

    it("should close the connection", function() {
      this.manager.connect();
      this.strategy.emit("open", this.transport);
      this.manager.disconnect();

      expect(this.connection.close).toHaveBeenCalled();
    });

    it("should abort the connection attempt", function() {
      this.manager.connect();
      this.manager.disconnect();

      expect(this.strategy.abort).toHaveBeenCalled();
    });

    it("should clear unavailable timer and activity check", function() {
      this.manager.connect();
      this.strategy.emit("open", this.transport)
      this.manager.disconnect();

      expect(clearTimeout.calls.length).toEqual(2);
    });
  });

  describe("on unexpected disconnection", function() {
    it("should transition to disconnected then to connecting", function() {
      var self = this;

      this.manager.connect();
      this.strategy.emit("open", this.transport);

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
      this.strategy.emit("open", this.transport);
      // unavailable timer should be cleared here
      expect(clearTimeout.calls.length).toEqual(1);

      this.connection.emit("closed");

      expect(this.strategy.abort).toHaveBeenCalled();
      // activity check should be cleared here
      // unavailable timer was cleared when connection was open
      expect(clearTimeout.calls.length).toEqual(2);
    });

    it("should force secure and reconnect after receiving 'ssl_only' event", function() {
      var self = this;

      this.manager.connect();
      this.strategy.emit("open", this.transport);
      this.connection.emit("ssl_only");

      expect(this.strategy.forceSecure).toHaveBeenCalledWith(true);
      expect(this.manager.state).toEqual("connecting");
    });

    it("should disconnect after receiving 'refused' event", function() {
      var self = this;

      this.manager.connect();
      this.strategy.emit("open", this.transport);
      this.connection.emit("refused");

      expect(this.manager.state).toEqual("disconnected");
    });

    it("should reconnect immediately after receiving 'retry' event", function() {
      var self = this;

      this.manager.connect();
      this.strategy.emit("open", this.transport);
      this.connection.emit("retry");

      expect(this.manager.state).toEqual("connecting");
    });
  });

  describe("on reconnection", function() {
    it("should use the same strategy to reconnect", function() {
      var onConnected = jasmine.createSpy("onConnected");
      this.manager.bind("connected", onConnected);

      this.manager.connect();

      expect(this.strategy.initialize.calls.length).toEqual(1);
      expect(this.strategy.connect.calls.length).toEqual(1);

      this.strategy.emit("open", this.transport);
      this.connection.emit("connected", "123.456");

      expect(onConnected.calls.length).toEqual(1);
      expect(this.manager.socket_id).toEqual("123.456");

      this.manager.disconnect();
      this.manager.connect();

      expect(this.strategy.initialize.calls.length).toEqual(2);
      expect(this.strategy.connect.calls.length).toEqual(2);

      this.strategy.emit("open", this.transport);
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
      this.strategy.emit("open", this.transport);
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
      this.strategy.emit("open", this.transport);

      setTimeout.calls[1].args[0].call(window);

      expect(this.connection.close).not.toHaveBeenCalled();
      setTimeout.calls[2].args[0].call(window);
      expect(this.connection.close).toHaveBeenCalled();
    });
  });

  describe("on ping", function() {
    it("should reply with a pusher:pong event", function() {
      this.manager.connect();
      this.strategy.emit("open", this.transport);
      this.connection.emit("connected", "666.999");

      this.connection.emit("ping");
      expect(this.connection.send_event)
        .toHaveBeenCalledWith("pusher:pong", {}, undefined);
    });
  });

  describe("with unsupported strategy", function() {
    it("should transition to failed on connect", function() {
      this.strategy.isSupported = jasmine.createSpy("isSupported")
        .andReturn(false)

      var onFailed = jasmine.createSpy("onFailed");
      this.manager.bind("failed", onFailed);

      this.manager.connect();
      expect(onFailed).toHaveBeenCalled();
    });
  });
});
