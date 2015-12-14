var Mocks = require('mocks');
var TimelineSender = require('timeline/timeline_sender');

// FIXME
xdescribe("TimelineSender", function() {
  var jsonpRequest;
  var timeline, onSend, sender;

  beforeEach(function() {
    timeline = Mocks.getTimeline();
    timeline.isEmpty.andReturn(false);
    timeline.send.andCallFake(function(sendJSONP, callback) {
      sendJSONP({ events: [1, 2, 3]}, callback);
    });

    onSend = jasmine.createSpy("onSend");
    spyOn(Pusher, "JSONPRequest").andCallFake(function() {
      // JSONPRequest and ScriptRequest have compatible interfaces
      jsonpRequest = Mocks.getScriptRequest();
      return jsonpRequest;
    });

    sender = new TimelineSender(timeline, {
      host: "example.com",
      path: "/timeline"
    });
  });

  describe("on construction", function() {
    it("should expose options", function() {
      sender = new TimelineSender(timeline, {
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
      sender.send(false, onSend);

      expect(JSONPRequest.calls.length).toEqual(1);
      expect(JSONPRequest).toHaveBeenCalledWith(
        "http://example.com/timeline",
        { "events": [1, 2, 3] }
      );
      expect(jsonpRequest.send).toHaveBeenCalled();
    });

    it("should send secure JSONP requests when encrypted", function() {
      var sender = new TimelineSender(timeline, {
        encrypted: true,
        host: "example.com",
        path: "/timeline"
      });
      sender.send(true, onSend);

      expect(JSONPRequest.calls.length).toEqual(1);
      expect(JSONPRequest).toHaveBeenCalledWith(
        "https://example.com/timeline",
        { "events": [1, 2, 3] }
      );
    });

    it("should register a receiver using ScriptReceivers", function() {
      sender.send(false, onSend);

      var jsonpReceiver = jsonpRequest.send.calls[0].args[0];
      expect(ScriptReceivers[jsonpReceiver.number]).toBe(jsonpReceiver.callback);
    });

    it("should call back after a successful JSONP request", function() {
      sender.send(false, onSend);

      expect(onSend).not.toHaveBeenCalled();
      var jsonpReceiver = jsonpRequest.send.calls[0].args[0];
      jsonpReceiver.callback(null, { result: "ok" });
      expect(onSend).toHaveBeenCalledWith(null, { result: "ok" });
    });

    it("should call back after an unsuccessful JSONP request", function() {
      sender.send(false, onSend);

      expect(onSend).not.toHaveBeenCalled();
      var jsonpReceiver = jsonpRequest.send.calls[0].args[0];
      jsonpReceiver.callback("ERROR!", undefined);
      expect(onSend).toHaveBeenCalledWith("ERROR!", undefined);
    });

    it("should remove the receiver from ScriptReceivers", function() {
      sender.send(false, onSend);

      var jsonpReceiver = jsonpRequest.send.calls[0].args[0];
      jsonpReceiver.callback(null, {});
      expect(ScriptReceivers[jsonpReceiver.number]).toBe(undefined);
    });

    it("should clean up the JSONP request", function() {
      sender.send(false, onSend);

      expect(jsonpRequest.cleanup).not.toHaveBeenCalled();
      var jsonpReceiver = jsonpRequest.send.calls[0].args[0];
      jsonpReceiver.callback(null, {});
      expect(jsonpRequest.cleanup).toHaveBeenCalled();
    });

    it("should not send an empty timeline", function() {
      timeline.isEmpty.andReturn(true);
      sender.send(false, onSend);
      expect(JSONPRequest).not.toHaveBeenCalled();
    });

    it("should use returned hostname for subsequent requests", function() {
      sender.send(false);

      var jsonpReceiver = jsonpRequest.send.calls[0].args[0];
      jsonpReceiver.callback(null, { host: "returned.example.com" });

      sender.send(false);
      expect(JSONPRequest).toHaveBeenCalledWith(
        "http://returned.example.com/timeline",
        { "events": [1, 2, 3] }
      );
    });
  });
});
