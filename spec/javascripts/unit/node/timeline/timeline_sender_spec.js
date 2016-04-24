require('isomorphic-fetch');
var fetchMock = require('fetch-mock');
var Mocks = require('mocks');
var TimelineSender = require('core/timeline/timeline_sender').default;
var Runtime = require('runtime').default;
var fetchTimeline = require('worker/timeline/fetch_timeline').default;

describe("TimelineSender", function() {
  var timeline, onSend, sender;

  beforeEach(function(){
    timeline = Mocks.getTimeline();
    timeline.isEmpty.andReturn(false);
    timeline.send.andCallFake(function(sendXHR, callback) {
      sendXHR({ events: [1, 2, 3]}, callback);
    });

    onSend = jasmine.createSpy("onSend");
    sender = new TimelineSender(timeline, {
      host: "example.com",
      path: "/timeline"
    });
  })

  describe("XHR", function(){
    var xhrRequest;

    beforeEach(function() {
      spyOn(Runtime, "createXHR").andCallFake(function() {
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

        expect(Runtime.createXHR.calls.length).toEqual(1);
        var encodedParams = 'WzEsMiwzXQ%3D%3D';

        expect(xhrRequest.open).toHaveBeenCalledWith(
          "GET",
          'http://example.com/timeline/2?events=WzEsMiwzXQ%3D%3D',
          true);

        expect(xhrRequest.send).toHaveBeenCalled();
      });

      it("should send secure XHR requests when encrypted", function() {
        var sender = new TimelineSender(timeline, {
          encrypted: true,
          host: "example.com",
          path: "/timeline"
        });
        sender.send(true, onSend);

        expect(Runtime.createXHR.calls.length).toEqual(1);
        expect(xhrRequest.open).toHaveBeenCalledWith(
          "GET",
          'https://example.com/timeline/2?events=WzEsMiwzXQ%3D%3D',
          true);
      });

      it("should not send an empty timeline", function() {
        timeline.isEmpty.andReturn(true);
        sender.send(false, onSend);
        expect(Runtime.createXHR).not.toHaveBeenCalled();
      });
    });
  });

  describe("fetch", function(){

    beforeEach(function(){
      Runtime.TimelineTransport = fetchTimeline;
    });

    afterEach(function(){
      fetchMock.restore();
    });

    describe("on send", function(){
      it ("should send a non-empty timeline", function(){
        var matcher = /example\.com/;
        var encodedParams = 'WzEsMiwzXQ%3D%3D';

        fetchMock.mock(matcher, 200);
        sender.send(false, onSend);

        var lastCall = fetchMock.lastCall(matcher)[0];
        expect(lastCall).toEqual('http://example.com/timeline/2?events=' + encodedParams);
      });
    });

    it("should send secure requests when encrypted", function(){
      var matcher = /example\.com/;
      var encodedParams = 'WzEsMiwzXQ%3D%3D';

      var sender = new TimelineSender(timeline, {
        encrypted: true,
        host: "example.com",
        path: "/timeline"
      });

      fetchMock.mock(matcher, 200);
      sender.send(true, onSend);

      var lastCall = fetchMock.lastCall(matcher)[0];
      expect(lastCall).toEqual('https://example.com/timeline/2?events=' + encodedParams);
    });
  });
});
