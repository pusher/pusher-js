var fetchMock = require('fetch-mock');
var Mocks = require('mocks');
var TimelineSender = require('core/timeline/timeline_sender').default;
var Runtime = require('runtime').default;
var fetchTimeline = require('worker/timeline/fetch_timeline').default;

describe("fetch", function(){
  var encodedParams, timeline, onSend, sender;

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

  it("should send secure requests when using TLS", function(){
    var matcher = /example\.com/;

    var sender = new TimelineSender(timeline, {
      useTLS: true,
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
