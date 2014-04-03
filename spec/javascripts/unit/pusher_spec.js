describe("Pusher", function() {
  var _isReady, _instances;

  beforeEach(function() {
    _instances = Pusher.instances;
    _isReady = Pusher.isReady;
    Pusher.isReady = false;
    Pusher.instances = [];

    spyOn(Pusher.StrategyBuilder, "build").andCallFake(function(definition, options) {
      var strategy = Pusher.Mocks.getStrategy(true);
      strategy.definition = definition;
      strategy.options = options;
      return strategy;
    });
    spyOn(Pusher, "ConnectionManager").andCallFake(function(key, options) {
      var manager = Pusher.Mocks.getConnectionManager();
      manager.key = key;
      manager.options = options;
      return manager;
    });
    spyOn(Pusher, "Channel").andCallFake(function(name, _) {
      return Pusher.Mocks.getChannel(name);
    });
    spyOn(Pusher.Util, "getDocument").andReturn({
      location: {
        protocol: "http:"
      }
    });
  });

  afterEach(function() {
    Pusher.instances = _instances;
    Pusher.isReady = _isReady;
  });

  describe("app key validation", function() {
    it("should allow a hex key", function() {
      spyOn(Pusher, "warn");
      var pusher = new Pusher("1234567890abcdef");
      expect(Pusher.warn).not.toHaveBeenCalled();
    });

    it("should warn on a null key", function() {
      spyOn(Pusher, "warn");
      var pusher = new Pusher(null);
      expect(Pusher.warn).toHaveBeenCalled();
    });

    it("should warn on an undefined key", function() {
      spyOn(Pusher, "warn");
      var pusher = new Pusher();
      expect(Pusher.warn).toHaveBeenCalled();
    });
  });

  describe("after construction", function() {
    var pusher;

    beforeEach(function() {
      pusher = new Pusher("foo");
    });

    it("should create a timeline with the correct key", function() {
      expect(pusher.timeline.key).toEqual("foo");
    });

    it("should create a timeline with a session id", function() {
      expect(pusher.timeline.session).toEqual(pusher.sessionID);
    });

    it("should pass the cluster name to the timeline", function() {
      var pusher = new Pusher("foo");
      expect(pusher.timeline.options.cluster).toBe(undefined);

      pusher = new Pusher("foo", { cluster: "spec" });
      expect(pusher.timeline.options.cluster).toEqual("spec");
    });

    it("should pass a feature list to the timeline", function() {
      spyOn(Pusher.Util, "getClientFeatures").andReturn(["foo", "bar"]);
      var pusher = new Pusher("foo");
      expect(pusher.timeline.options.features).toEqual(["foo", "bar"]);
    });

    it("should pass the version number to the timeline", function() {
      expect(pusher.timeline.options.version).toEqual(Pusher.VERSION);
    });

    it("should pass per-connection timeline params", function() {
      pusher = new Pusher("foo", { timelineParams: { horse: true } });
      expect(pusher.timeline.options.params).toEqual({ horse: true });
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
        Pusher.Util.getDocument.andReturn({
          location: {
            protocol: "https:"
          }
        });
        expect(pusher.isEncrypted()).toBe(true);
      });
    });

    describe("with getStrategy function", function() {
      it("should construct a strategy instance", function() {
        var strategy = pusher.connection.options.getStrategy();
        expect(strategy.isSupported).toEqual(jasmine.any(Function));
        expect(strategy.connect).toEqual(jasmine.any(Function));
      });

      it("should pass per-connection strategy options", function() {
        pusher = new Pusher("foo", { encrypted: true });

        var expectedConfig = Pusher.Util.extend(
          Pusher.getGlobalConfig(),
          { encrypted: true }
        );

        var getStrategy = pusher.connection.options.getStrategy;
        expect(getStrategy().options).toEqual(expectedConfig);
        expect(getStrategy().definition).toEqual(
          Pusher.getDefaultStrategy(expectedConfig)
        );
      });

      it("should pass options to the strategy builder", function() {
        var expectedConfig = Pusher.Util.extend(
          Pusher.getGlobalConfig(),
          { encrypted: true }
        );

        var getStrategy = pusher.connection.options.getStrategy;
        expect(getStrategy({ encrypted: true }).options).toEqual(
          expectedConfig
        );
        expect(getStrategy({ encrypted: true }).definition).toEqual(
          Pusher.getDefaultStrategy(expectedConfig)
        );
      });
    });

    describe("connection manager", function() {
      it("should have the right key", function() {
        var pusher = new Pusher("beef");
        expect(pusher.connection.key).toEqual("beef");
      });

      it("should have default timeouts", function() {
        var pusher = new Pusher("foo");
        var options = pusher.connection.options;

        expect(options.activityTimeout).toEqual(Pusher.activity_timeout);
        expect(options.pongTimeout).toEqual(Pusher.pong_timeout);
        expect(options.unavailableTimeout).toEqual(Pusher.unavailable_timeout);
      });

      it("should use user-specified timeouts", function() {
        var pusher = new Pusher("foo", {
          activityTimeout: 123,
          pongTimeout: 456,
          unavailableTimeout: 789
        });
        var options = pusher.connection.options;

        expect(options.activityTimeout).toEqual(123);
        expect(options.pongTimeout).toEqual(456);
        expect(options.unavailableTimeout).toEqual(789);
      });

      it("should be unencrypted by default", function() {
        var pusher = new Pusher("foo");
        expect(pusher.connection.options.encrypted).toBe(false);
      });

      it("should be encrypted when specified in Pusher constructor", function() {
        var pusher = new Pusher("foo", { encrypted: true });
        expect(pusher.connection.options.encrypted).toBe(true);
      });

      it("should be encrypted when using HTTPS", function() {
        Pusher.Util.getDocument.andReturn({
          location: {
            protocol: "https:"
          }
        });
        var pusher = new Pusher("foo", { encrypted: true });
        expect(pusher.connection.options.encrypted).toBe(true);
      });
    });
  });

  describe(".ready", function() {
    it("should start connection attempts for instances", function() {
      var pusher = new Pusher();
      spyOn(pusher, "connect");

      expect(pusher.connect).not.toHaveBeenCalled();
      Pusher.ready();
      expect(pusher.connect).toHaveBeenCalled();
    });
  });

  describe("#connect", function() {
    it("should call connect on connection manager", function() {
      var pusher = new Pusher("foo", { disableStats: true });
      pusher.connect();
      expect(pusher.connection.connect).toHaveBeenCalledWith();
    });
  });

  describe("after connecting", function() {
    beforeEach(function() {
      pusher = new Pusher("foo", { disableStats: true });
      pusher.connect();
      pusher.connection.state = "connected";
      pusher.connection.emit("connected");
    });

    it("should subscribe to all channels", function() {
      var pusher = new Pusher("foo", { disableStats: true });

      var subscribedChannels = {
        "channel1": pusher.subscribe("channel1"),
        "channel2": pusher.subscribe("channel2")
      };

      expect(subscribedChannels.channel1.subscribe).not.toHaveBeenCalled();
      expect(subscribedChannels.channel2.subscribe).not.toHaveBeenCalled();

      pusher.connect();
      pusher.connection.state = "connected";
      pusher.connection.emit("connected");

      expect(subscribedChannels.channel1.subscribe).toHaveBeenCalled();
      expect(subscribedChannels.channel2.subscribe).toHaveBeenCalled();
    });

    it("should send events via the connection manager", function() {
      pusher.send_event("event", { key: "value" }, "channel");
      expect(pusher.connection.send_event).toHaveBeenCalledWith(
        "event", { key: "value" }, "channel"
      );
    });

    describe("#subscribe", function() {
      it("should return the same channel object for subsequent calls", function() {
        var channel = pusher.subscribe("xxx");
        expect(channel.name).toEqual("xxx");
        expect(pusher.subscribe("xxx")).toBe(channel);
      });

      it("should subscribe the channel", function() {
        var channel = pusher.subscribe("xxx");
        expect(channel.subscribe).toHaveBeenCalled();
      });
    });

    describe("#unsubscribe", function() {
      it("should unsubscribe the channel", function() {
        var channel = pusher.subscribe("yyy");
        expect(channel.unsubscribe).not.toHaveBeenCalled();

        pusher.unsubscribe("yyy");
        expect(channel.unsubscribe).toHaveBeenCalled();
      });
    });
  });

  describe("on message", function() {
    var pusher;

    beforeEach(function() {
      pusher = new Pusher("foo", { disableStats: true });
    });

    it("should pass events to their channels", function() {
      var channel = pusher.subscribe("chan");

      pusher.connection.emit("message", {
        channel: "chan",
        event: "event",
        data: { key: "value" }
      });
      expect(channel.handleEvent).toHaveBeenCalledWith(
        "event", { key: "value" }
      );
    });

    it("should not publish events to other channels", function() {
      var channel = pusher.subscribe("chan");
      var onEvent = jasmine.createSpy("onEvent");
      channel.bind("event", onEvent);

      pusher.connection.emit("message", {
        channel: "different",
        event: "event",
        data: {}
      });
      expect(onEvent).not.toHaveBeenCalled();
    });

    it("should publish per-channel events globally (deprecated)", function() {
      var onEvent = jasmine.createSpy("onEvent");
      pusher.bind("event", onEvent);

      pusher.connection.emit("message", {
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

      pusher.connection.emit("message", {
        event: "global",
        data: "data"
      });
      expect(onEvent).toHaveBeenCalledWith("data");
      expect(onAllEvents).toHaveBeenCalledWith("global", "data");
    });

    it("should not publish internal events", function() {
      var onEvent = jasmine.createSpy("onEvent");
      pusher.bind("pusher_internal:test", onEvent);

      pusher.connection.emit("message", {
        event: "pusher_internal:test",
        data: "data"
      });
      expect(onEvent).not.toHaveBeenCalled();
    });
  });

  describe("#disconnect", function() {
    it("should call disconnect on connection manager", function() {
      var pusher = new Pusher("foo");

      pusher.disconnect();
      expect(pusher.connection.disconnect).toHaveBeenCalledWith();
    });
  });

  describe("after disconnecting", function() {
    it("should disconnect channels", function() {
      var pusher = new Pusher("foo", { disableStats: true });
      var channel1 = pusher.subscribe("channel1");
      var channel2 = pusher.subscribe("channel2");

      pusher.connection.state = "disconnected";
      pusher.connection.emit("disconnected");

      expect(channel1.disconnect).toHaveBeenCalledWith();
      expect(channel2.disconnect).toHaveBeenCalledWith();
    });
  });

  describe("on error", function() {
    it("should log a warning to console", function() {
      var pusher = new Pusher("foo", { disableStats: true });

      spyOn(Pusher, "warn");
      pusher.connection.emit("error", "something");
      expect(Pusher.warn).toHaveBeenCalledWith("Error", "something");
    });
  });

  describe("metrics", function() {
    var timelineSender;
    var pusher;

    beforeEach(function() {
      jasmine.Clock.useMock();

      timelineSender = Pusher.Mocks.getTimelineSender();
      spyOn(Pusher, "TimelineSender").andReturn(timelineSender);

      pusher = new Pusher("foo");
    });

    it("should be sent to stats.pusher.com by default", function() {
      expect(Pusher.TimelineSender.calls.length).toEqual(1);
      expect(Pusher.TimelineSender).toHaveBeenCalledWith(
        pusher.timeline, { host: "stats.pusher.com", path: "/timeline/v2/jsonp" }
      );
    });

    it("should be sent to a hostname specified in constructor options", function() {
      var pusher = new Pusher("foo", {
        statsHost: "example.com"
      });
      expect(Pusher.TimelineSender).toHaveBeenCalledWith(
        pusher.timeline, { host: "example.com", path: "/timeline/v2/jsonp" }
      );
    });

    it("should not be sent if disableStats option is passed", function() {
      var pusher = new Pusher("foo", { disableStats: true });
      pusher.connect();
      pusher.connection.options.timeline.info({});
      jasmine.Clock.tick(1000000);
      expect(timelineSender.send.calls.length).toEqual(0);
    });

    it("should not be sent before calling connect", function() {
      pusher.connection.options.timeline.info({});
      jasmine.Clock.tick(1000000);
      expect(timelineSender.send.calls.length).toEqual(0);
    });

    it("should be sent every 60 seconds after calling connect", function() {
      pusher.connect();
      expect(Pusher.TimelineSender.calls.length).toEqual(1);

      pusher.connection.options.timeline.info({});

      jasmine.Clock.tick(59999);
      expect(timelineSender.send.calls.length).toEqual(0);
      jasmine.Clock.tick(1);
      expect(timelineSender.send.calls.length).toEqual(1);
      jasmine.Clock.tick(60000);
      expect(timelineSender.send.calls.length).toEqual(2);
    });

    it("should be sent after connecting", function() {
      pusher.connect();
      pusher.connection.options.timeline.info({});

      pusher.connection.state = "connected";
      pusher.connection.emit("connected");

      expect(timelineSender.send.calls.length).toEqual(1);
    });

    it("should not be sent after disconnecting", function() {
      pusher.connect();
      pusher.disconnect();

      pusher.connection.options.timeline.info({});

      jasmine.Clock.tick(1000000);
      expect(timelineSender.send.calls.length).toEqual(0);
    });

    it("should be sent unencrypted if connection is unencrypted", function() {
      pusher.connection.isEncrypted.andReturn(false);

      pusher.connect();
      pusher.connection.options.timeline.info({});

      pusher.connection.state = "connected";
      pusher.connection.emit("connected");

      expect(timelineSender.send).toHaveBeenCalledWith(false);
    });

    it("should be sent encrypted if connection is encrypted", function() {
      pusher.connection.isEncrypted.andReturn(true);

      pusher.connect();
      pusher.connection.options.timeline.info({});

      pusher.connection.state = "connected";
      pusher.connection.emit("connected");

      expect(timelineSender.send).toHaveBeenCalledWith(true);
    });
  });
});
