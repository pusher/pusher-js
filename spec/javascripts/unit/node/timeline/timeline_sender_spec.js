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

  describe("fetch", function(){
    var encodedParams;

    beforeEach(function(){
      Runtime.TimelineTransport = fetchTimeline;
      encodedParams = 'WzEsMiwzXQ%3D%3D';
    });

    afterEach(function(){
      fetchMock.restore();
    });

    describe("on send", function(){
      it ("should send a non-empty timeline", function(){
        var matcher = /example\.com/;

        fetchMock.mock(matcher, 200);
        sender.send(false, onSend);

        var lastCall = fetchMock.lastCall(matcher)[0];
        expect(lastCall).toEqual('http://example.com/timeline/2?events=' + encodedParams);
      });
    });

    it("should send secure requests when encrypted", function(){
      var matcher = /example\.com/;

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

    it("should use returned hostname for subsequent requests", function(done) {
      var matcher = /example\.com/;

      fetchMock.mock(matcher, {
        status: 200,
        body: JSON.stringify({host: "returned.example.com"})
      });

      sender.send(false);

      setTimeout(function(){
        sender.send(false)
        var lastCall = fetchMock.lastCall(matcher)[0];
        expect(lastCall).toEqual('http://returned.example.com/timeline/2?events=' + encodedParams);
        done();
      }, 10);
    });
  });
});
