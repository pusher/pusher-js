describe("Pusher", function() {
  var _isReady, _instances;
  var strategy, manager, pusher;

  function expectValidSubscriptions(manager, channels) {
    var channel, channelName;
    for (channelName in channels) {
      channel = channels[channelName];
      expect(channel.authorize)
        .toHaveBeenCalledWith(manager.socket_id, {}, jasmine.any(Function));
    }

    for (channelName in channels) {
      channel = channels[channelName];
      channel.authorize.calls[0].args[2](null, {
        auth: { auth: channelName },
        channel_data: { data: channelName }
      });
      expect(channel.authorize)
        .toHaveBeenCalledWith(manager.socket_id, {}, jasmine.any(Function));
      expect(manager.send_event).toHaveBeenCalledWith(
        "pusher:subscribe",
        { channel: channel.name,
          auth: { auth: channelName },
          channel_data: { data: channelName }
        },
        undefined
      );
    }
  }

  beforeEach(function() {
    _instances = Pusher.instances;
    _isReady = Pusher.isReady;
    Pusher.isReady = false;
    Pusher.instances = [];

    spyOn(Pusher.WSTransport, "isSupported").andReturn(true);
    spyOn(Pusher.FlashTransport, "isSupported").andReturn(false);

    strategy = Pusher.Mocks.getStrategy(true);
    manager = Pusher.Mocks.getConnectionManager();

    spyOn(Pusher.StrategyBuilder, "build").andReturn(strategy);
    spyOn(Pusher, "ConnectionManager").andReturn(manager);
    spyOn(Pusher, "Channel").andCallFake(function(name, _) {
      return Pusher.Mocks.getChannel(name);
    });
    spyOn(Pusher.JSONPRequest, "send");
    spyOn(Pusher.Util, "getDocumentLocation").andReturn({
      protocol: "http:"
    });

    pusher = new Pusher("foo");
  });

  afterEach(function() {
    Pusher.instances = _instances;
    Pusher.isReady = _isReady;
  });

  it("should find subscribed channels", function() {
    var channel = pusher.subscribe("chan");
    expect(pusher.channel("chan")).toBe(channel);
  });

  it("should not find unsubscribed channels", function() {
    expect(pusher.channel("chan")).toBe(undefined);
    pusher.subscribe("chan");
    pusher.unsubscribe("chan");
    expect(pusher.channel("chan")).toBe(undefined);
  });

  describe("encryption", function() {
    it("should be off by default", function() {
      expect(pusher.isEncrypted()).toBe(false);
    });

    it("should be on when 'encrypted' parameter is passed", function() {
      var pusher = new Pusher("foo", { encrypted: true });
      expect(pusher.isEncrypted()).toBe(true);
    });

    it("should be on when using https", function() {
      Pusher.Util.getDocumentLocation.andReturn({
        protocol: "https:"
      });
      expect(pusher.isEncrypted()).toBe(true);
    });
  });

  describe("app key validation", function() {
    it("should allow a hex key", function() {
      spyOn(Pusher, "warn");
      new Pusher("1234567890abcdef");
      expect(Pusher.warn).not.toHaveBeenCalled();
    });

    it("should warn on a null key", function() {
      spyOn(Pusher, "warn");
      pusher = new Pusher(null);
      expect(Pusher.warn).toHaveBeenCalled();
    });

    it("should warn on an undefined key", function() {
      spyOn(Pusher, "warn");
      pusher = new Pusher();
      expect(Pusher.warn).toHaveBeenCalled();
    });
  });

  describe("on ready", function() {
    it("should start a connection attempt", function() {
      var pusher = new Pusher();
      spyOn(pusher, "connect");

      expect(pusher.connect).not.toHaveBeenCalled();
      Pusher.ready();
      expect(pusher.connect).toHaveBeenCalled();
    });
  });

  describe("on connection manager construction", function() {
    it("should pass the key", function() {
      expect(Pusher.ConnectionManager)
        .toHaveBeenCalledWith("foo", jasmine.any(Object));
    });

    it("should pass default timeouts", function() {
      var options = Pusher.ConnectionManager.calls[0].args[1];

      expect(options.activityTimeout).toEqual(Pusher.activity_timeout);
      expect(options.pongTimeout).toEqual(Pusher.pong_timeout);
      expect(options.unavailableTimeout).toEqual(Pusher.unavailable_timeout);
    });

    it("should pass user-specified timeouts", function() {
      new Pusher("foo", {
        activityTimeout: 123,
        pongTimeout: 456,
        unavailableTimeout: 789
      });
      // first call is from beforeEach
      var options = Pusher.ConnectionManager.calls[1].args[1];

      expect(options.activityTimeout).toEqual(123);
      expect(options.pongTimeout).toEqual(456);
      expect(options.unavailableTimeout).toEqual(789);
    });

    it("should respect the 'encrypted' option", function() {
      new Pusher("foo", { encrypted: true });

      expect(Pusher.ConnectionManager.calls[0].args[1].encrypted)
        .toEqual(false);
      expect(Pusher.ConnectionManager.calls[1].args[1].encrypted)
        .toEqual(true);
    });
  });

  describe("on connect", function() {
    var managerOptions;

    beforeEach(function() {
      pusher.connect();
      managerOptions = Pusher.ConnectionManager.calls[0].args[1];
    });

    it("should call connect on connection manager", function() {
      expect(manager.connect).toHaveBeenCalledWith();
    });

    describe("with getStrategy function", function() {
      it("should construct a strategy instance", function() {
        var strategy = managerOptions.getStrategy();
        expect(strategy.isSupported).toEqual(jasmine.any(Function));
        expect(strategy.connect).toEqual(jasmine.any(Function));
      });

      it("should pass per-connection strategy options", function() {
        pusher = new Pusher("foo", { encrypted: true });
        pusher.connect();

        managerOptions = Pusher.ConnectionManager.calls[1].args[1];
        managerOptions.getStrategy();

        expect(Pusher.StrategyBuilder.build)
          .toHaveBeenCalledWith(
            Pusher.getDefaultStrategy(), { encrypted: true }
          );
      });

      it("should pass options to the strategy builder", function() {
        managerOptions.getStrategy({ encrypted: true });
        expect(Pusher.StrategyBuilder.build)
          .toHaveBeenCalledWith(
            Pusher.getDefaultStrategy(), { encrypted: true }
          );
      });
    });

    describe("with getTimeline function", function() {
      beforeEach(function() {
        spyOn(Pusher.Util, "getClientFeatures").andReturn(["foo", "bar"]);
      });

      it("should create a timeline with the correct key", function() {
        expect(managerOptions.getTimeline().key).toEqual("foo");
      });

      it("should create a timeline with a session id", function() {
        expect(managerOptions.getTimeline().session)
          .toEqual(jasmine.any(Number));
      });

      it("should pass a feature list to the timeline", function() {
        expect(managerOptions.getTimeline().options.features)
          .toEqual(["foo", "bar"]);
      });

      it("should pass the version number to the timeline", function() {
        expect(managerOptions.getTimeline().options.version)
          .toEqual(Pusher.VERSION);
      });

      it("should pass per-connection timeline params", function() {
        pusher = new Pusher("foo", { timelineParams: { horse: true } });
        pusher.connect();
        managerOptions = Pusher.ConnectionManager.calls[1].args[1];

        expect(managerOptions.getTimeline().options.params)
          .toEqual({ horse: true });
      });
    });

    describe("with getTimelineSender function", function() {
      var timeline;

      beforeEach(function() {
        timeline = Pusher.Mocks.getTimeline();
      });

      it("should create a sender with correct host and path", function() {
        var sender = managerOptions.getTimelineSender(timeline, {}, manager);
        expect(sender.options.host).toEqual(Pusher.stats_host);
        expect(sender.options.path).toEqual("/timeline");
      });

      it("should create an unencrypted sender by default", function() {
        var sender = managerOptions.getTimelineSender(timeline, {}, manager);
        expect(sender.isEncrypted()).toBe(false);
      });

      it("should create an encrypted sender for encrypted connections", function() {
        pusher = new Pusher("foo", { encrypted: true });
        pusher.connect();
        managerOptions = Pusher.ConnectionManager.calls[1].args[1];

        var sender = managerOptions.getTimelineSender(timeline, {}, manager);
        expect(sender.isEncrypted()).toBe(true);
      });

      it("should create an encrypted sender if specified in options", function() {
        var sender = managerOptions.getTimelineSender(
          timeline,
          { encrypted: true },
          manager
        );
        expect(sender.isEncrypted()).toBe(true);
      });

      it("should create a null sender when stats are disabled", function() {
        pusher = new Pusher("foo", { disableStats: true });
        pusher.connect();
        managerOptions = Pusher.ConnectionManager.calls[1].args[1];

        var sender = managerOptions.getTimelineSender(timeline, {}, manager);
        expect(sender).toBe(null);
      });
    });
  });

  describe("on connected", function() {
    it("should subscribe to all channels", function() {
      var subscribedChannels = {
        "channel1": pusher.subscribe("channel1"),
        "channel2": pusher.subscribe("channel2")
      };

      expect(subscribedChannels.channel1.authorize).not.toHaveBeenCalled();
      expect(subscribedChannels.channel2.authorize).not.toHaveBeenCalled();

      pusher.connect();
      manager.state = "connected";
      manager.emit("connected");

      expectValidSubscriptions(manager, subscribedChannels);
    });
  });

  describe("after connected", function() {
    beforeEach(function() {
      pusher.connect();
      manager.state = "connected";
      manager.emit("connected");
    });

    it("should send events to connection manager", function() {
      pusher.send_event("event", { key: "value" }, "channel");
      expect(manager.send_event)
        .toHaveBeenCalledWith("event", { key: "value" }, "channel");
    });

    describe("on subscribe", function() {
      it("should return the same channel object for subsequent calls", function() {
        var channel = pusher.subscribe("xxx");
        expect(channel.name).toEqual("xxx");
        expect(pusher.subscribe("xxx")).toBe(channel);
      });

      it("should authorize and send a subscribe event", function() {
        var channel = pusher.subscribe("xxx");
        expectValidSubscriptions(manager, { "xxx" : channel });
      });

      it("should pass pusher:subscription_error event after auth error", function() {
        var channel = pusher.subscribe("wrong");

        channel.authorize.calls[0].args[2](true, "ERROR");
        expect(channel.handleEvent)
          .toHaveBeenCalledWith("pusher:subscription_error", "ERROR");
      });
    });

    describe("on unsubscribe", function() {
      it("should send a unsubscribe event", function() {
        pusher.subscribe("yyy");
        pusher.unsubscribe("yyy");

        expect(manager.send_event).toHaveBeenCalledWith(
          "pusher:unsubscribe", { channel: "yyy" }, undefined
        );
      });
    });
  });

  describe("on message", function() {
    it("should pass events to their channels", function() {
      var channel = pusher.subscribe("chan");

      manager.emit("message", {
        channel: "chan",
        event: "event",
        data: { key: "value" }
      });
      expect(channel.handleEvent)
        .toHaveBeenCalledWith("event", { key: "value" });
    });

    it("should not publish events to other channels", function() {
      var channel = pusher.subscribe("chan");
      var onEvent = jasmine.createSpy("onEvent");
      channel.bind("event", onEvent);

      manager.emit("message", {
        channel: "different",
        event: "event",
        data: {}
      });
      expect(onEvent).not.toHaveBeenCalled();
    });

    it("should publish per-channel events globally (deprecated)", function() {
      var onEvent = jasmine.createSpy("onEvent");
      pusher.bind("event", onEvent);

      manager.emit("message", {
        channel: "chan",
        event: "event",
        data: { key: "value" }
      });
      expect(onEvent).toHaveBeenCalledWith({ key: "value" });
    });

    it("should publish global events (deprecated)", function() {
      var onEvent = jasmine.createSpy("onEvent");
      var onAllEvents = jasmine.createSpy("onAllEvents");
      pusher.bind("global", onEvent);
      pusher.bind_all(onAllEvents);

      manager.emit("message", {
        event: "global",
        data: "data"
      });
      expect(onEvent).toHaveBeenCalledWith("data");
      expect(onAllEvents).toHaveBeenCalledWith("global", "data");
    });

    it("should not publish internal events", function() {
      var onEvent = jasmine.createSpy("onEvent");
      pusher.bind("pusher_internal:test", onEvent);

      manager.emit("message", {
        event: "pusher_internal:test",
        data: "data"
      });
      expect(onEvent).not.toHaveBeenCalled();
    });
  });

  describe("on disconnect", function() {
    beforeEach(function() {
      pusher.disconnect();
    });

    it("should call disconnect on connection manager", function() {
      expect(manager.disconnect).toHaveBeenCalledWith();
    });
  });

  describe("on disconnected", function() {
    it("should disconnect channels", function() {
      var channel1 = pusher.subscribe("channel1");
      var channel2 = pusher.subscribe("channel2");
      manager.state = "disconnected";
      manager.emit("disconnected");
      expect(channel1.disconnect).toHaveBeenCalledWith();
      expect(channel2.disconnect).toHaveBeenCalledWith();
    });
  });

  describe("on error", function() {
    it("should log a warning to console", function() {
      spyOn(Pusher, "warn");
      manager.emit("error", "something");
      expect(Pusher.warn).toHaveBeenCalledWith("Error", "something");
    });
  });
});
