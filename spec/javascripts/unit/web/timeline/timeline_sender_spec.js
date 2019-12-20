var Mocks = require('mocks');
var TimelineSender = require('core/timeline/timeline_sender').default;
var Runtime = require('runtime').default;
var ScriptReceivers = require('dom/script_receiver_factory').ScriptReceivers;
var Collections = require('core/utils/collections');


describe("TimelineSender", function() {
  var xhrRequest;
  var timeline, onSend, sender, qs;

  beforeEach(function() {
    timeline = Mocks.getTimeline();
    timeline.isEmpty.andReturn(false);
    var eventData = { events: [1, 2, 3]}

    timeline.send.andCallFake(function(sendFn, callback) {
      sendFn(eventData, callback);
    });
    qs = Collections.buildQueryString(eventData);

    onSend = jasmine.createSpy("onSend");
    spyOn(Runtime, "createXHR").andCallFake(function() {
      xhrRequest = Mocks.getXHR();
      return xhrRequest;
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

      expect(Runtime.createXHR.calls.length).toEqual(1);
      expect(xhrRequest.open.calls.length).toEqual(1);
      expect(xhrRequest.send.calls.length).toEqual(1);

      var qs = Collections.buildQueryString({ events: [1, 2, 3]})
      expect(xhrRequest.open).toHaveBeenCalledWith(
        "GET",
        `http://example.com/timeline/2?${qs}`,
        true,
      );
    });

    it("should send secure XHR requests when using TLS", function() {
      var sender = new TimelineSender(timeline, {
        useTLS: true,
        host: "example.com",
        path: "/timeline"
      });
      sender.send(true, onSend);

      expect(Runtime.createXHR).toHaveBeenCalled()
      expect(xhrRequest.open).toHaveBeenCalledWith(
        "GET",
        `https://example.com/timeline/2?${qs}`,
        true,
      );
    });

    it("should call back after a successful XHR request", function() {
      sender.send(false, onSend);

      expect(onSend).not.toHaveBeenCalled();

      xhrRequest.readyState = 4
      xhrRequest.responseText = JSON.stringify({result: "ok"})
      xhrRequest.status = 200
      xhrRequest.onreadystatechange()

      expect(onSend).toHaveBeenCalled();

      expect(onSend).toHaveBeenCalledWith(null, { result: "ok" });
    });

    it("should call back after an unsuccessful XHR request", function() {
      sender.send(false, onSend);

      expect(onSend).not.toHaveBeenCalled();

      xhrRequest.readyState = 4
      xhrRequest.status = 400
      xhrRequest.onreadystatechange()

      expect(onSend).toHaveBeenCalled();

      expect(onSend).toHaveBeenCalledWith(jasmine.any(String), null)
      var errorArg = onSend.calls[0].args
      expect(errorArg).toMatch(/Error.*400/)
    });

    it("should not send an empty timeline", function() {
      timeline.isEmpty.andReturn(true);
      sender.send(false, onSend);
      expect(Runtime.createXHR).not.toHaveBeenCalled();
    });

    it("should use returned hostname for subsequent requests", function() {
      sender.send(false);

      xhrRequest.readyState = 4
      xhrRequest.responseText = JSON.stringify({host: "returned.example.com"})
      xhrRequest.status = 200
      xhrRequest.onreadystatechange()

      sender.send(false);
      expect(Runtime.createXHR).toHaveBeenCalled()
      expect(xhrRequest.open).toHaveBeenCalledWith(
        "GET",
        `http://returned.example.com/timeline/2?${qs}`,
        true,
      );
    });
  });
});
