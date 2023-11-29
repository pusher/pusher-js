var TestEnv = require("testenv");
var Util = require("core/util").default;
var Collections = require("core/utils/collections");
var Logger = require("core/logger").default;
var Defaults = require("core/defaults").default;
var DefaultConfig = require("core/config");
var TimelineSender = require("core/timeline/timeline_sender").default;
var Pusher = require("core/pusher").default;
var Mocks = require("../../helpers/mocks");
var Factory = require("core/utils/factory").default;
var Runtime = require("runtime").default;
const transports = Runtime.Transports;
const Network = require("net_info").Network;
const waitsFor = require("../../helpers/waitsFor");
var NetInfo = require("net_info").NetInfo;

describe("Pusher", function() {
  var _isReady, _instances, _logToConsole;

  switch (TestEnv) {
    case "worker":
    case "node":
      var timelineTransport = "xhr";
      break;
    case "web":
      var timelineTransport = "jsonp";
      break;
    default:
      throw "Please specify the test environment as an external.";
  }

  beforeEach(function() {
    _instances = Pusher.instances;
    _isReady = Pusher.isReady;
    _logToConsole = Pusher.logToConsole;
    Pusher.isReady = false;
    Pusher.instances = [];

    spyOn(Runtime, "getDefaultStrategy").and.callFake(function() {
      return Mocks.getStrategy(true);
    });

    spyOn(Factory, "createConnectionManager").and.callFake(function(
      key,
      options,
      config
    ) {
      var manager = Mocks.getConnectionManager();
      manager.key = key;
      manager.options = options;
      manager.config = config;
      return manager;
    });
    spyOn(Factory, "createChannel").and.callFake(function(name, _) {
      return Mocks.getChannel(name);
    });

    if (TestEnv === "web") {
      spyOn(Runtime, "getDocument").and.returnValue({
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
      expect(function() {
        new Pusher(null);
      }).toThrow("You must pass your app key when you instantiate Pusher.");
    });

    it("should throw on an undefined key", function() {
      expect(function() {
        new Pusher();
      }).toThrow("You must pass your app key when you instantiate Pusher.");
    });

    it("should allow a hex key", function() {
      spyOn(Logger, "warn");
      var pusher = new Pusher("1234567890abcdef", { cluster: "mt1" });
      expect(Logger.warn).not.toHaveBeenCalled();
    });
  });

  describe("options validation", function() {
    it("should throw if options are not supplied", function() {
      expect(function() {
        var pusher = new Pusher("1234567890abcdef");
      }).toThrow("You must pass an options object");
    });

    it("should throw if no cluster is supplied", function() {
      expect(function() {
        var pusher = new Pusher("1234567890abcdef", {});
      }).toThrow("Options object must provide a cluster");
    });
  });

  describe("after construction", function() {
    var pusher;

    beforeEach(function() {
      pusher = new Pusher("foo", {cluster: "mt1"});
    });

    it("should create a timeline with the correct key", function() {
      expect(pusher.timeline.key).toEqual("foo");
    });

    it("should create a timeline with a session id", function() {
      expect(pusher.timeline.session).toEqual(pusher.sessionID);
    });

    it("should pass the cluster name to the timeline", function() {
      var pusher = new Pusher("foo", {cluster: "mt1"});
      expect(pusher.timeline.options.cluster).toBe("mt1");

      pusher = new Pusher("foo", { cluster: "spec" });
      expect(pusher.timeline.options.cluster).toEqual("spec");
    });

    it("should pass a feature list to the timeline", function() {
      spyOn(Pusher, "getClientFeatures").and.returnValue(["foo", "bar"]);
      var pusher = new Pusher("foo", {cluster: "mt1"});
      expect(pusher.timeline.options.features).toEqual(["foo", "bar"]);
    });

    it("should pass the version number to the timeline", function() {
      expect(pusher.timeline.options.version).toEqual(Defaults.VERSION);
    });

    it("should pass per-connection timeline params", function() {
      pusher = new Pusher("foo", { cluster: "mt1", timelineParams: { horse: true } });
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
        expect(pusher.shouldUseTLS()).toBe(true);
      });

      it("should be off when forceTLS parameter is passed", function() {
        var pusher = new Pusher("foo", { cluster: "mt1", forceTLS: false });
        expect(pusher.shouldUseTLS()).toBe(false);
      });

      if (TestEnv === "web") {
        it("should be on when using https", function() {
          Runtime.getDocument.and.returnValue({
            location: {
              protocol: "https:"
            }
          });
          var pusher = new Pusher("foo", { cluster: "mt1", forceTLS: false });
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

      it("should pass config and options to the strategy builder", function() {
        var config = DefaultConfig.getConfig({});
        var options = { useTLS: true };

        var getStrategy = pusher.connection.options.getStrategy;
        getStrategy(options);
        expect(Runtime.getDefaultStrategy).toHaveBeenCalledWith(
          pusher.config,
          options,
          jasmine.any(Function)
        );
      });
    });

    describe("connection manager", function() {
      it("should have the right key", function() {
        var pusher = new Pusher("beef", {cluster: "mt1"});
        expect(pusher.connection.key).toEqual("beef");
      });

      it("should have default timeouts", function() {
        var pusher = new Pusher("foo", {cluster: "mt1"});
        var options = pusher.connection.options;

        expect(options.activityTimeout).toEqual(Defaults.activityTimeout);
        expect(options.pongTimeout).toEqual(Defaults.pongTimeout);
        expect(options.unavailableTimeout).toEqual(Defaults.unavailableTimeout);
      });

      it("should use user-specified timeouts", function() {
        var pusher = new Pusher("foo", {
          cluster: "mt1",
          activityTimeout: 123,
          pongTimeout: 456,
          unavailableTimeout: 789
        });
        var options = pusher.connection.options;

        expect(options.activityTimeout).toEqual(123);
        expect(options.pongTimeout).toEqual(456);
        expect(options.unavailableTimeout).toEqual(789);
      });
    });
  });

  describe(".ready", function() {
    it("should start connection attempts for instances", function() {
      var pusher = new Pusher("01234567890abcdef", {cluster: "mt1"});
      spyOn(pusher, "connect");

      expect(pusher.connect).not.toHaveBeenCalled();
      Pusher.ready();
      expect(pusher.connect).toHaveBeenCalled();
    });
  });

  describe("#connect", function() {
    it("should call connect on connection manager", function() {
      var pusher = new Pusher("foo", {cluster: "mt1"});
      pusher.connect();
      expect(pusher.connection.connect).toHaveBeenCalledWith();
    });
  });

  describe("after connecting", function() {
    var pusher;

    beforeEach(function() {
      pusher = new Pusher("foo", {cluster: "mt1"});
      pusher.connect();
      pusher.connection.state = "connected";
      pusher.connection.emit("connected");
    });

    it("should subscribe to all channels", function() {
      pusher = new Pusher("foo", {cluster: "mt1"});
      var subscribedChannels = {
        channel1: pusher.subscribe("channel1"),
        channel2: pusher.subscribe("channel2")
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
        "event",
        { key: "value" },
        "channel"
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
      });
    });

    describe("switch cluster", function() {
      var pusher;
      var subscribedChannels

      beforeEach(function() {
        pusher = new Pusher("foo", {cluster: "mt1"});

        subscribedChannels = {
          channel1: pusher.subscribe("channel1"),
          channel2: pusher.subscribe("channel2")
        };

        pusher.connect();
        pusher.connection.state = "connected";
        pusher.connection.emit("connected");
      });

      it("should resubscribe to all channels", function() {
        expect(subscribedChannels.channel1.subscribe).toHaveBeenCalledTimes(1);
        expect(subscribedChannels.channel2.subscribe).toHaveBeenCalledTimes(1);

        pusher.switchCluster({ appKey: 'bar', cluster: 'us3' });
        pusher.connect();
        pusher.connection.state = 'connected';
        pusher.connection.emit('connected');

        expect(subscribedChannels.channel1.subscribe).toHaveBeenCalledTimes(2);
        expect(subscribedChannels.channel2.subscribe).toHaveBeenCalledTimes(2);
      });

      it("should send events via the connection manager", function() {
        pusher.switchCluster({ appKey: 'bar', cluster: 'us3' });
        pusher.send_event("event", { key: "value" }, "channel");
        expect(pusher.connection.send_event).toHaveBeenCalledWith(
          "event",
          { key: "value" },
          "channel"
        );
      });

      it('should keep the persist the previous options', () => {
        var authorizeSpy = jasmine.createSpy("authorizeSpy");
        const options = {
          cluster: "mt1",
          enableStats: true,
          channelAuthorization: {
            customHandler: authorizeSpy
          }
        };

        var pusher = new Pusher("foo", options);
        pusher.connect();
        pusher.switchCluster({ appKey: 'bar', cluster: 'us3' });

        expect(pusher.options).toEqual({ ...options, cluster: 'us3' });
      })
    })

    describe("#unsubscribe", function() {
      it("should unsubscribe the channel if subscription is not pending", function() {
        var channel = pusher.subscribe("yyy");
        channel.subscribed = true;
        expect(channel.unsubscribe).not.toHaveBeenCalled();

        pusher.unsubscribe("yyy");
        expect(channel.unsubscribe).toHaveBeenCalled();
      });

      it("should not unsubscribe the channel if the channel is not subscribed", function() {
        var channel = pusher.subscribe("yyy");
        channel.subscribed = false;
        expect(channel.unsubscribe).not.toHaveBeenCalled();

        pusher.unsubscribe("yyy");
        expect(channel.unsubscribe).not.toHaveBeenCalled();
      });

      it("should remove the channel from .channels if subscription is not pending", function() {
        var channel = pusher.subscribe("yyy");
        expect(pusher.channel("yyy")).toBe(channel);

        pusher.unsubscribe("yyy");
        expect(pusher.channel("yyy")).toBe(undefined);
      });

      it("should delay unsubscription if the subscription is pending", function() {
        var channel = pusher.subscribe("yyy");
        channel.subscriptionPending = true;

        pusher.unsubscribe("yyy");
        expect(pusher.channel("yyy")).toBe(channel);
        expect(channel.unsubscribe).not.toHaveBeenCalled();
        expect(channel.cancelSubscription).toHaveBeenCalled();
      });
    });
  });

  describe("on message", function() {
    var pusher;

    beforeEach(function() {
      pusher = new Pusher("foo", {cluster: "mt1"});
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
        data: { key: "value" }
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
    var pusher;

    beforeEach(function() {
      pusher = new Pusher("foo", {cluster: "mt1"});
    });

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
      var pusher = new Pusher("foo", {cluster: "mt1"});

      pusher.disconnect();
      expect(pusher.connection.disconnect).toHaveBeenCalledWith();
    });
  });

  describe("after disconnecting", function() {
    it("should disconnect channels", function() {
      var pusher = new Pusher("foo", {cluster: "mt1"});
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
      var pusher = new Pusher("foo", {cluster: "mt1"});

      spyOn(Logger, "warn");
      pusher.connection.emit("error", "something");
      expect(Logger.warn).toHaveBeenCalledWith("something");
    });
  });

  describe("metrics", function() {
    var timelineSender;

    beforeEach(function() {
      jasmine.clock().uninstall();
      jasmine.clock().install();

      timelineSender = Mocks.getTimelineSender();
      spyOn(Factory, "createTimelineSender").and.returnValue(timelineSender);
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    it("should be sent to stats.pusher.com", function() {
      var pusher = new Pusher("foo", { cluster: "mt1", enableStats: true });
      expect(Factory.createTimelineSender.calls.count()).toEqual(1);
      expect(Factory.createTimelineSender).toHaveBeenCalledWith(
        pusher.timeline,
        { host: "stats.pusher.com", path: "/timeline/v2/" + timelineTransport }
      );
    });

    it("should be sent to a hostname specified in constructor options", function() {
      var pusher = new Pusher("foo", {
        cluster: "mt1",
        statsHost: "example.com",
        enableStats: true
      });
      expect(Factory.createTimelineSender).toHaveBeenCalledWith(
        pusher.timeline,
        { host: "example.com", path: "/timeline/v2/" + timelineTransport }
      );
    });

    it("should not be sent by default", function() {
      var pusher = new Pusher("foo", {cluster: "mt1"});
      pusher.connect();
      pusher.connection.options.timeline.info({});
      jasmine.clock().tick(1000000);
      expect(timelineSender.send.calls.count()).toEqual(0);
    });

    it("should be sent if disableStats set to false", function() {
      var pusher = new Pusher("foo", { cluster: "mt1", disableStats: false });
      pusher.connect();
      pusher.connection.options.timeline.info({});
      expect(Factory.createTimelineSender.calls.count()).toEqual(1);
      expect(Factory.createTimelineSender).toHaveBeenCalledWith(
        pusher.timeline,
        { host: "stats.pusher.com", path: "/timeline/v2/" + timelineTransport }
      );
    });

    it("should honour enableStats setting if enableStats and disableStats set", function() {
      var pusher = new Pusher("foo", { cluster: "mt1", disableStats: true, enableStats: true });
      pusher.connect();
      pusher.connection.options.timeline.info({});
      expect(Factory.createTimelineSender.calls.count()).toEqual(1);
      expect(Factory.createTimelineSender).toHaveBeenCalledWith(
        pusher.timeline,
        { host: "stats.pusher.com", path: "/timeline/v2/" + timelineTransport }
      );
    });

    it("should not be sent before calling connect", function() {
      var pusher = new Pusher("foo", { cluster: "mt1", enableStats: true });
      pusher.connection.options.timeline.info({});
      jasmine.clock().tick(1000000);
      expect(timelineSender.send.calls.count()).toEqual(0);
    });

    it("should be sent every 60 seconds after calling connect", function() {
      var pusher = new Pusher("foo", { cluster: "mt1", enableStats: true });
      pusher.connect();
      expect(Factory.createTimelineSender.calls.count()).toEqual(1);

      pusher.connection.options.timeline.info({});

      jasmine.clock().tick(59999);
      expect(timelineSender.send.calls.count()).toEqual(0);
      jasmine.clock().tick(1);
      expect(timelineSender.send.calls.count()).toEqual(1);
      jasmine.clock().tick(60000);
      expect(timelineSender.send.calls.count()).toEqual(2);
    });

    it("should be sent after connecting", function() {
      var pusher = new Pusher("foo", { cluster: "mt1", enableStats: true });
      pusher.connect();
      pusher.connection.options.timeline.info({});

      pusher.connection.state = "connected";
      pusher.connection.emit("connected");

      expect(timelineSender.send.calls.count()).toEqual(1);
    });

    it("should not be sent after disconnecting", function() {
      var pusher = new Pusher("foo", { cluster: "mt1", enableStats: true });
      pusher.connect();
      pusher.disconnect();

      pusher.connection.options.timeline.info({});

      jasmine.clock().tick(1000000);
      expect(timelineSender.send.calls.count()).toEqual(0);
    });

    it("should be sent without TLS if connection is not using TLS", function() {
      var pusher = new Pusher("foo", { cluster: "mt1", enableStats: true });
      pusher.connection.isUsingTLS.and.returnValue(false);

      pusher.connect();
      pusher.connection.options.timeline.info({});

      pusher.connection.state = "connected";
      pusher.connection.emit("connected");

      expect(timelineSender.send).toHaveBeenCalledWith(false);
    });

    it("should be sent with TLS if connection is over TLS", function() {
      var pusher = new Pusher("foo", { cluster: "mt1", enableStats: true });
      pusher.connection.isUsingTLS.and.returnValue(true);

      pusher.connect();
      pusher.connection.options.timeline.info({});

      pusher.connection.state = "connected";
      pusher.connection.emit("connected");

      expect(timelineSender.send).toHaveBeenCalledWith(true);
    });
  });
});
