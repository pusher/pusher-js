describe("Timeline", function() {
  beforeEach(function() {
    this.jsonp = Pusher.Mocks.getJSONPSender();
    this.timeline = new Pusher.Timeline(666, this.jsonp);
    this.onSend = jasmine.createSpy("onSend")
  });

  describe("on send", function() {
    it("should include key, session id, features and version", function() {
      var timeline = new Pusher.Timeline(666, this.jsonp, {
        key: "foobar",
        features: ["x", "y", "z"],
        version: "6.6.6"
      });

      expect(timeline.send(this.onSend)).toBe(true);
      expect(this.jsonp.send).toHaveBeenCalledWith(
        { key: "foobar",
          session: 666,
          features: ["x", "y", "z"],
          version: "6.6.6",
          timeline: []
        },
        jasmine.any(Function)
      );
    });

    it("should include pushed events", function() {
      spyOn(Pusher.Util, "now");

      Pusher.Util.now.andReturn(1000);
      this.timeline.push({a: 1});
      Pusher.Util.now.andReturn(2000);
      this.timeline.push({ foo: "bar" });
      Pusher.Util.now.andReturn(100000);
      this.timeline.push({b: 2.2});

      expect(this.timeline.send(this.onSend)).toBe(true);
      expect(this.jsonp.send).toHaveBeenCalledWith(
        { session: 666,
          timeline: [
            { timestamp: 1000, a: 1 },
            { timestamp: 2000, foo: "bar" },
            { timestamp: 100000, b: 2.2 }
          ]
        },
        jasmine.any(Function)
      );
    });

    it("should not send extra info in second request", function() {
      var sendCallback = null;
      this.jsonp.send.andCallFake(function(data, callback) {
        sendCallback = callback;
      });
      var timeline = new Pusher.Timeline(666, this.jsonp, {
        key: "foobar",
        features: ["x", "y", "z"],
        version: "6.6.6"
      });

      // first call
      expect(timeline.send(this.onSend)).toBe(true);
      expect(this.jsonp.send).toHaveBeenCalledWith(
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
      expect(timeline.send(this.onSend)).toBe(true);
      expect(this.jsonp.send).toHaveBeenCalledWith(
        { session: 666, timeline: [] }, jasmine.any(Function)
      );
    });

    it("should respect the size limit", function() {
      spyOn(Pusher.Util, "now").andReturn(123);

      var timeline = new Pusher.Timeline(123, this.jsonp, { limit: 3 });
      for (var i = 1; i <= 4; i++) {
        timeline.push({ i: i })
      }

      expect(timeline.send(this.onSend)).toBe(true);
      expect(this.jsonp.send).toHaveBeenCalledWith(
        { session: 123,
          timeline: [
            { timestamp: 123, i: 2},
            { timestamp: 123, i: 3},
            { timestamp: 123, i: 4}
          ]
        },
        jasmine.any(Function)
      );
    });

    it("should not try to send JSONP requests without a sender", function() {
      var timeline = new Pusher.Timeline(666, null, {
        features: ["x", "y", "z"],
        version: "6.6.6"
      });

      expect(timeline.send(this.onSend)).toBe(false);
    });
  });
});
