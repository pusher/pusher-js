var Network = require('net_info').Network;
var TimelineLevel = require('core/timeline/level').default;
var Timeline = require("core/timeline/timeline").default;
var util = require("core/util").default;

describe("Timeline", function() {
  var sendJSONP, onSend, timeline;

  beforeEach(function() {
    sendJSONP = jasmine.createSpy("sendJSONP");
    onSend = jasmine.createSpy("onSend");
    timeline = new Timeline("foo", 666, {
      level: TimelineLevel.DEBUG
    });
  });

  it("should expose the key, session id and options", function() {
    var timeline = new Timeline("foobar", 666, {
      level: TimelineLevel.INFO,
      cluster: "test",
      features: ["x", "y", "z"]
    });
    expect(timeline.key).toEqual("foobar");
    expect(timeline.session).toEqual(666);
    expect(timeline.options.features).toEqual(["x", "y", "z"]);
    expect(timeline.options.cluster).toEqual("test");
  });

  it("should initially be empty", function() {
    expect(timeline.isEmpty()).toBe(true);
  });

  it("should not be empty after pushing an event", function() {
    timeline.log(TimelineLevel.INFO, {});
    expect(timeline.isEmpty()).toBe(false);
  });

  it("should not log events with too low level", function() {
    timeline = new Timeline("foo", 666, {
      level: Timeline.ERROR
    });
    timeline.log(TimelineLevel.INFO, {});
    expect(timeline.isEmpty()).toBe(true);
  });

  it("should generate different ids", function() {
    expect(timeline.generateUniqueID()).not.toEqual(timeline.generateUniqueID());
  });

  describe("on send", function() {
    beforeEach(function() {
      spyOn(Network, "isOnline").andReturn(true);
    });

    it("should include key, session id, cluster, features, version and params", function() {
      var timeline = new Timeline("foobar", 666, {
        level: TimelineLevel.INFO,
        cluster: "test",
        features: ["x", "y", "z"],
        version: "6.6.6",
        params: {
          x: 1,
          y: "2"
        }
      });

      expect(timeline.send(sendJSONP, onSend)).toBe(true);
      expect(sendJSONP).toHaveBeenCalledWith(
        { bundle: 1,
          key: "foobar",
          session: 666,
          cluster: "test",
          features: ["x", "y", "z"],
          lib: "js",
          version: "6.6.6",
          x: 1,
          y: "2",
          timeline: []
        },
        jasmine.any(Function)
      );
    });

    it("should include pushed events", function() {
      spyOn(util, "now");

      util.now.andReturn(1000);
      timeline.log(2, {a: 1});
      util.now.andReturn(2000);
      timeline.error({ b: 2.2 });
      util.now.andReturn(100000);
      timeline.info({ foo: "bar" });
      util.now.andReturn(100001);
      timeline.debug({ debug: true });

      expect(timeline.send(sendJSONP, onSend)).toBe(true);
      expect(sendJSONP).toHaveBeenCalledWith(
        { bundle: 1,
          key: "foo",
          session: 666,
          lib: "js",
          timeline: [
            { timestamp: 1000, a: 1 },
            { timestamp: 2000, b: 2.2 },
            { timestamp: 100000, foo: "bar" },
            { timestamp: 100001, debug: true }
          ]
        },
        jasmine.any(Function)
      );
    });

    it("should become empty again", function() {
      timeline.log(TimelineLevel.INFO, {});
      timeline.send(sendJSONP, onSend);
      expect(timeline.isEmpty()).toBe(true);
    });

    it("should respect the size limit", function() {
      spyOn(util, "now").andReturn(123);

      var timeline = new Timeline("bar", 123, {
        level: TimelineLevel.INFO,
        limit: 3
      });
      for (var i = 1; i <= 4; i++) {
        timeline.log(TimelineLevel.INFO, { i: i });
      }

      expect(timeline.send(sendJSONP, onSend)).toBe(true);
      expect(sendJSONP).toHaveBeenCalledWith(
        { bundle: 1,
          key: "bar",
          session: 123,
          lib: "js",
          timeline: [
            { timestamp: 123, i: 2},
            { timestamp: 123, i: 3},
            { timestamp: 123, i: 4}
          ]
        },
        jasmine.any(Function)
      );
    });
  });
});
