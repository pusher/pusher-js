var TestEnv = require('testenv');
var Util = require('core/util').default;
var Collections = require('core/utils/collections');
var Logger = require('core/logger').default;
var StrategyBuilder = require('core/strategies/strategy_builder');
var Defaults = require('core/defaults').default;
var DefaultConfig = require('core/config');
var TimelineSender = require('core/timeline/timeline_sender').default;
var Pusher = require('core/pusher').default;
var Mocks = require('../../helpers/mocks');
var Factory = require('core/utils/factory').default;
var Runtime = require('runtime').default;

describe("Pusher", function() {
  var _isReady, _instances, _logToConsole;

  switch (TestEnv) {
    case "worker":
    case "node":
      var timelineTransport = "xhr";
      break;
    case "web":
      var timelineTransport = "jsonp";
      break
    default:
      throw("Please specify the test environment as an external.")
  }

  beforeEach(function() {
    _instances = Pusher.instances;
    _isReady = Pusher.isReady;
    _logToConsole = Pusher.logToConsole;
    Pusher.isReady = false;
    Pusher.instances = [];

    spyOn(StrategyBuilder, "build").andCallFake(function(definition, options) {
      var strategy = Mocks.getStrategy(true);
      strategy.definition = definition;
      strategy.options = options;
      return strategy;
    });

    spyOn(Factory, "createConnectionManager").andCallFake(function(key, options) {
      var manager = Mocks.getConnectionManager();
      manager.key = key;
      manager.options = options;
      return manager;
    });
    spyOn(Factory, "createChannel").andCallFake(function(name, _) {
      return Mocks.getChannel(name);
    });

    if (TestEnv === "web") {
      spyOn(Runtime, "getDocument").andReturn({
        location: {
          protocol: "http:"
        }
      });
    }
  });

  afterEach(function() {
    Pusher.instances = _instances;
    Pusher.isReady = _isReady;
    Pusher.logToConsole = _logToConsole;
  });

  describe("app key validation", function() {
    it("should throw on a null key", function() {
      expect(function() { new Pusher(null) }).toThrow("You must pass your app key when you instantiate Pusher.");
    });

    it("should throw on an undefined key", function() {
      expect(function() { new Pusher() }).toThrow("You must pass your app key when you instantiate Pusher.");
    });

    it("should allow a hex key", function() {
      spyOn(Logger, "warn");
      var pusher = new Pusher("1234567890abcdef", { cluster: "mt1" });
      expect(Logger.warn).not.toHaveBeenCalled();
    });

    it("should warn if no cluster is supplied", function() {
      spyOn(Logger, "warn");
      var pusher = new Pusher("1234567890abcdef");
      expect(Logger.warn).toHaveBeenCalled();
    });

    it("should not warn if no cluster is supplied if wsHost or httpHost are supplied", function() {
      spyOn(Logger, "warn");
      var wsPusher = new Pusher("1234567890abcdef", { wsHost: 'example.com' });
      var httpPusher = new Pusher("1234567890abcdef", { httpHost: 'example.com' });
      expect(Logger.warn).not.toHaveBeenCalled();
      expect(Logger.warn).not.toHaveBeenCalled();
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
      spyOn(Pusher, "getClientFeatures").andReturn(["foo", "bar"]);
      var pusher = new Pusher("foo");
      expect(pusher.timeline.options.features).toEqual(["foo", "bar"]);
    });

    it("should pass the version number to the timeline", function() {
      expect(pusher.timeline.options.version).toEqual(Defaults.VERSION);
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

    describe("TLS", function() {
      it("should be off by default", function() {
        expect(pusher.shouldUseTLS()).toBe(false);
      });

      it("should be on when 'forceTLS' parameter is passed", function() {
        var pusher = new Pusher("foo", { forceTLS: true });
        expect(pusher.shouldUseTLS()).toBe(true);
      });

      if (TestEnv === "web") {
        it("should be on when using https", function() {
          Runtime.getDocument.andReturn({
            location: {
              protocol: "https:"
            }
          });
          expect(pusher.shouldUseTLS()).toBe(true);
        });
      }
    });

    describe("with getStrategy function", function() {
      it("should construct a strategy instance", function() {
        var strategy = pusher.connection.options.getStrategy();
        expect(strategy.isSupported).toEqual(jasmine.any(Function));
        expect(strategy.connect).toEqual(jasmine.any(Function));
      });

      it("should pass per-connection strategy options", function() {
        pusher = new Pusher("foo", { forceTLS: true });

        var expectedConfig = Collections.extend(
          DefaultConfig.getGlobalConfig(),
          { forceTLS: true }
        );

        var getStrategy = pusher.connection.options.getStrategy;
        expect(getStrategy().options).toEqual(expectedConfig);
        expect(getStrategy().definition).toEqual(
          Runtime.getDefaultStrategy(expectedConfig)
        );
      });

      it("should pass options to the strategy builder", function() {
        var expectedConfig = Collections.extend(
          DefaultConfig.getGlobalConfig(),
          { useTLS: true }
        );

        var getStrategy = pusher.connection.options.getStrategy;
        expect(getStrategy({ useTLS: true }).options).toEqual(
          expectedConfig
        );
        expect(getStrategy({ useTLS: true }).definition).toEqual(
          Runtime.getDefaultStrategy(expectedConfig)
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

        expect(options.activityTimeout).toEqual(Defaults.activity_timeout);
        expect(options.pongTimeout).toEqual(Defaults.pong_timeout);
        expect(options.unavailableTimeout).toEqual(Defaults.unavailable_timeout);
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

      it("should not use TLS by default", function() {
        var pusher = new Pusher("foo");
        expect(pusher.connection.options.useTLS).toBe(false);
      });

      it("should use TLS when specified in Pusher constructor", function() {
        var pusher = new Pusher("foo", { forceTLS: true });
        expect(pusher.connection.options.useTLS).toBe(true);
      });

      if (TestEnv === "web") {
        it("should use TLS when using HTTPS", function() {
          Runtime.getDocument.andReturn({
            location: {
              protocol: "https:"
            }
          });
          var pusher = new Pusher("foo", { forceTLS: true });
          expect(pusher.connection.options.useTLS).toBe(true);
        });
      }
    });
  });

  describe(".ready", function() {
    it("should start connection attempts for instances", function() {
      var pusher = new Pusher("01234567890abcdef");
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

      it("should reinstate cancelled pending subscription", function() {
        var channel = pusher.subscribe("xxx");
        channel.subscriptionPending = true;
        channel.subscriptionCancelled = true;
        pusher.subscribe("xxx");

        expect(channel.reinstateSubscription).toHaveBeenCalled();
      })
    });

    describe("#unsubscribe", function() {
      it("should unsubscribe the channel if subscription is not pending", function() {
        var channel = pusher.subscribe("yyy");
        expect(channel.unsubscribe).not.toHaveBeenCalled();

        pusher.unsubscribe("yyy");
        expect(channel.unsubscribe).toHaveBeenCalled();
      });

      it("should remove the channel from .channels if subscription is not pending", function () {
        var channel = pusher.subscribe("yyy");
        expect(pusher.channel("yyy")).toBe(channel);

        pusher.unsubscribe("yyy");
        expect(pusher.channel("yyy")).toBe(undefined);
      });

      it("should delay unsubscription if the subscription is pending", function () {
        var channel = pusher.subscribe("yyy");
        channel.subscriptionPending = true;

        pusher.unsubscribe("yyy");
        expect(pusher.channel("yyy")).toBe(channel);
        expect(channel.unsubscribe).not.toHaveBeenCalled();
        expect(channel.cancelSubscription).toHaveBeenCalled();
      })
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
      expect(channel.handleEvent).toHaveBeenCalledWith({
        channel: "chan",
        event: "event",
        data: { key: "value" },
      });
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
      pusher.bind_global(onAllEvents);

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

  describe("#unbind", function() {
    it("should allow a globally bound callback to be removed", function() {
      var onEvent = jasmine.createSpy("onEvent");
      pusher.bind("event", onEvent);
      pusher.unbind("event", onEvent);

      pusher.connection.emit("message", {
        channel: "chan",
        event: "event",
        data: { key: "value" }
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

      spyOn(Logger, "warn");
      pusher.connection.emit("error", "something");
      expect(Logger.warn).toHaveBeenCalledWith("Error", "something");
    });
  });

  describe("metrics", function() {
    var timelineSender;
    var pusher;

    beforeEach(function() {
      jasmine.Clock.useMock();

      timelineSender = Mocks.getTimelineSender();
      spyOn(Factory, "createTimelineSender").andReturn(timelineSender);

      pusher = new Pusher("foo");
    });

    it("should be sent to stats.pusher.com by default", function() {
      expect(Factory.createTimelineSender.calls.length).toEqual(1);
      expect(Factory.createTimelineSender).toHaveBeenCalledWith(
        pusher.timeline, { host: "stats.pusher.com", path: "/timeline/v2/" + timelineTransport }
      );
    });

    it("should be sent to a hostname specified in constructor options", function() {
      var pusher = new Pusher("foo", {
        statsHost: "example.com"
      });
      expect(Factory.createTimelineSender).toHaveBeenCalledWith(
        pusher.timeline, { host: "example.com", path: "/timeline/v2/" + timelineTransport }
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
      expect(Factory.createTimelineSender.calls.length).toEqual(1);

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

    it("should be sent without TLS if connection is not using TLS", function() {
      pusher.connection.isUsingTLS.andReturn(false);

      pusher.connect();
      pusher.connection.options.timeline.info({});

      pusher.connection.state = "connected";
      pusher.connection.emit("connected");

      expect(timelineSender.send).toHaveBeenCalledWith(false);
    });

    it("should be sent with TLS if connection is over TLS", function() {
      pusher.connection.isUsingTLS.andReturn(true);

      pusher.connect();
      pusher.connection.options.timeline.info({});

      pusher.connection.state = "connected";
      pusher.connection.emit("connected");

      expect(timelineSender.send).toHaveBeenCalledWith(true);
    });
  });
});
