var Mocks = require('mocks');
var TimelineSender = require('core/timeline/timeline_sender').default;
var Runtime = require('runtime').default;

describe("TimelineSender", function() {
  var timeline, onSend, sender;

  beforeEach(function(){
    timeline = Mocks.getTimeline();
    timeline.isEmpty.and.returnValue(false);
    timeline.send.and.callFake(function(sendXHR, callback) {
      sendXHR({ events: [1, 2, 3]}, callback);
    });

    onSend = jasmine.createSpy("onSend");
    sender = new TimelineSender(timeline, {
      host: "example.com",
      path: "/timeline"
    });
  });

  describe("XHR", function(){
    var xhrRequest;

    beforeEach(function() {
      spyOn(Runtime, "createXHR").and.callFake(function() {
        xhrRequest = Mocks.getXHR();
        return xhrRequest;
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

        expect(Runtime.createXHR.calls.count()).toEqual(1);
        var encodedParams = 'WzEsMiwzXQ%3D%3D';

        expect(xhrRequest.open).toHaveBeenCalledWith(
          "GET",
          'http://example.com/timeline/2?events=WzEsMiwzXQ%3D%3D',
          true);

        expect(xhrRequest.send).toHaveBeenCalled();
      });

      it("should not send an empty timeline", function() {
        timeline.isEmpty.and.returnValue(true);
        sender.send(false, onSend);
        expect(Runtime.createXHR).not.toHaveBeenCalled();
      });

      it("should use returned hostname for subsequent requests", function() {
        sender.send(false);
        xhrRequest.readyState = 4;
        xhrRequest.status = 200;
        xhrRequest.responseText = JSON.stringify({host: "returned.example.com"});
        xhrRequest.onreadystatechange();

        sender.send(false);
        expect(xhrRequest.open).toHaveBeenCalledWith(
          'GET',
          'http://returned.example.com/timeline/2?events=WzEsMiwzXQ%3D%3D',
          true
        );
      });
    });
  });
});
