describe("Timeline", function() {
  var sendJSONP, onSend, timeline;

  beforeEach(function() {
    sendJSONP = jasmine.createSpy("sendJSONP");
    onSend = jasmine.createSpy("onSend");
    timeline = new Pusher.Timeline("foo", 666);
  });

  it("should expose the key, session id and options", function() {
    var timeline = new Pusher.Timeline("foobar", 666, {
      features: ["x", "y", "z"],
    });
    expect(timeline.key).toEqual("foobar");
    expect(timeline.session).toEqual(666);
    expect(timeline.options.features).toEqual(["x", "y", "z"]);
  });

  it("should initially be empty", function() {
    expect(timeline.isEmpty()).toBe(true);
  });

  it("should not be empty after pushing an event", function() {
    timeline.push({});
    expect(timeline.isEmpty()).toBe(false);
  });

  describe("on send", function() {
    it("should include key, session id, features, version and params", function() {
      var timeline = new Pusher.Timeline("foobar", 666, {
        features: ["x", "y", "z"],
        version: "6.6.6",
        params: {
          x: 1,
          y: "2"
        }
      });

      expect(timeline.send(sendJSONP, onSend)).toBe(true);
      expect(sendJSONP).toHaveBeenCalledWith(
        { key: "foobar",
          session: 666,
          features: ["x", "y", "z"],
          version: "6.6.6",
          x: 1,
          y: "2",
          timeline: []
        },
        jasmine.any(Function)
      );
    });

    it("should include pushed events", function() {
      spyOn(Pusher.Util, "now");

      Pusher.Util.now.andReturn(1000);
      timeline.push({a: 1});
      Pusher.Util.now.andReturn(2000);
      timeline.push({ foo: "bar" });
      Pusher.Util.now.andReturn(100000);
      timeline.push({b: 2.2});

      expect(timeline.send(sendJSONP, onSend)).toBe(true);
      expect(sendJSONP).toHaveBeenCalledWith(
        { key: "foo",
          session: 666,
          timeline: [
            { timestamp: 1000, a: 1 },
            { timestamp: 2000, foo: "bar" },
            { timestamp: 100000, b: 2.2 }
          ]
        },
        jasmine.any(Function)
      );
    });

    it("should become empty again", function() {
      timeline.push({});
      timeline.send(sendJSONP, onSend);
      expect(timeline.isEmpty()).toBe(true);
    });

    it("should not send extra info in second request", function() {
      var sendCallback = null;
      sendJSONP.andCallFake(function(data, callback) {
        sendCallback = callback;
      });
      var timeline = new Pusher.Timeline("foobar", 666, {
        features: ["x", "y", "z"],
        version: "6.6.6"
      });

      // first call
      expect(timeline.send(sendJSONP, onSend)).toBe(true);
      expect(sendJSONP).toHaveBeenCalledWith(
        { key: "foobar",
          session: 666,
          features: ["x", "y", "z"],
          version: "6.6.6",
          timeline: []
        },
        jasmine.any(Function)
      );
      sendCallback(null);
      // second call
      expect(timeline.send(sendJSONP, onSend)).toBe(true);
      expect(sendJSONP).toHaveBeenCalledWith(
        { session: 666,
          timeline: []
        },
        jasmine.any(Function)
      );
    });

    it("should respect the size limit", function() {
      spyOn(Pusher.Util, "now").andReturn(123);

      var timeline = new Pusher.Timeline("bar", 123, { limit: 3 });
      for (var i = 1; i <= 4; i++) {
        timeline.push({ i: i });
      }

      expect(timeline.send(sendJSONP, onSend)).toBe(true);
      expect(sendJSONP).toHaveBeenCalledWith(
        { key: "bar",
          session: 123,
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
