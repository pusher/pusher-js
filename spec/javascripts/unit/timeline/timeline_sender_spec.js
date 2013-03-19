describe("TimelineSender", function() {
  var timeline, onSend, sender;

  beforeEach(function() {
    timeline = Pusher.Mocks.getTimeline();
    timeline.isEmpty.andReturn(false);
    timeline.send.andCallFake(function(sendJSONP, callback) {
      sendJSONP({ events: [1, 2, 3]}, callback);
    });

    onSend = jasmine.createSpy("onSend");
    spyOn(Pusher.JSONPRequest, "send");

    sender = new Pusher.TimelineSender(timeline, {
      host: "example.com",
      path: "/timeline"
    });
  });

  describe("on construction", function() {
    it("should be unencrypted by default", function() {
      expect(sender.isEncrypted()).toBe(false);
    });

    it("should be encrypted when encrypted options is passed", function() {
      sender = new Pusher.TimelineSender(timeline, { encrypted: true });
      expect(sender.isEncrypted()).toBe(true);
    });

    it("should expose options", function() {
      sender = new Pusher.TimelineSender(timeline, {
        host: "localhost",
        port: 666
      });
      expect(sender.options).toEqual({
        host: "localhost",
        port: 666
      });
    });
  });

  describe("on send", function() {
    it("should send a non-empty timeline", function() {
      sender.send(onSend);

      expect(Pusher.JSONPRequest.send).toHaveBeenCalledWith(
        { data: { "events": [1, 2, 3] },
          url: "http://example.com/timeline",
          receiver: Pusher.JSONP
        },
        jasmine.any(Function)
      );
    });

    it("should call back after a successful JSONP request", function() {
      sender.send(onSend);

      expect(onSend).not.toHaveBeenCalled();
      var jsonpCallback = Pusher.JSONPRequest.send.calls[0].args[1];
      jsonpCallback(null, {});
      expect(onSend).toHaveBeenCalled();
    });

    it("should send secure JSONP requests when encrypted", function() {
      sender = new Pusher.TimelineSender(timeline, {
        encrypted: true,
        host: "example.com",
        path: "/timeline"
      });
      sender.send(onSend);

      expect(Pusher.JSONPRequest.send).toHaveBeenCalledWith(
        { data: { "events": [1, 2, 3] },
          url: "https://example.com/timeline",
          receiver: Pusher.JSONP
        },
        jasmine.any(Function)
      );
    });

    it("should not send an empty timeline", function() {
      timeline.isEmpty.andReturn(true);
      sender.send(onSend);
      expect(Pusher.JSONPRequest.send).not.toHaveBeenCalled();
    });
  });
});
