const Pusher = require('pusher_integration');
window.Pusher = Pusher;

const Integration = require('integration');
const JSONPRequest = require('dom/jsonp_request').default;
const waitsFor = require('../../../helpers/waitsFor');

Integration.describe("JSONP", function() {
  it("should send a request and receive a correct response", async function() {
    var callback = jasmine.createSpy();
    var receiver = Pusher.ScriptReceivers.create(callback);
    var url = Integration.API_URL + "/v2/jsonp/echo";
    var request;

    request = new JSONPRequest(url, {
      "session": 2289545,
      "features": ["ws", "sockjs"],
      "version": "1.13.0",
      "t0": 1355850357911,
      "timeline": [
        { t:    0, e: 2 },
        { t:    2, e: 2, type: "ws" },
        { t: 1001, e: 4, type: "ws" },
        { t: 1001, e: 0, type: "sockjs" },
        { t: 2000, e: 5 },
        { t: 2158, e: 1, type: "sockjs" },
        { t: 2378, e: 2, type: "sockjs" },
        { t: 3892, e: 3, type: "sockjs" },
        { t: 3892, e: 3 }
      ]
    });
    request.send(receiver);

    await waitsFor(function() {
      return callback.calls.count() > 0;
    }, "JSONP to respond", 5000);

    expect(callback.calls.count()).toEqual(1);
    expect(callback).toHaveBeenCalledWith(null, {
      "session": 2289545,
      "features": ["ws", "sockjs"],
      "version": "1.13.0",
      "t0": 1355850357911,
      "timeline": [
        { t:    0, e: 2 },
        { t:    2, e: 2, type: "ws" },
        { t: 1001, e: 4, type: "ws" },
        { t: 1001, e: 0, type: "sockjs" },
        { t: 2000, e: 5 },
        { t: 2158, e: 1, type: "sockjs" },
        { t: 2378, e: 2, type: "sockjs" },
        { t: 3892, e: 3, type: "sockjs" },
        { t: 3892, e: 3 }
      ]
    });

    request.cleanup()
  });

  it("should call back without a result on 404 response", async function() {
    var callback = jasmine.createSpy();
    var receiver = Pusher.ScriptReceivers.create(callback);
    var url = Integration.API_URL + "/jsonp/404";
    var request;

    request = new JSONPRequest(url, {});
    request.send(receiver);

    await waitsFor(function() {
      return callback.calls.count() > 0;
    }, "JSONP to respond", 5000);

    expect(callback.calls.count()).toEqual(1);
    expect(callback.calls.first().args[1]).toBe(undefined);

    request.cleanup();
  });

  it("should call back without a result on 500 response", async function() {
    var callback = jasmine.createSpy();
    var receiver = Pusher.ScriptReceivers.create(callback);
    var url = Integration.API_URL + "/jsonp/500";
    var request;

    request = new JSONPRequest(url, {});
    request.send(receiver);

    await waitsFor(function() {
      return callback.calls.count() > 0;
    }, "JSONP to respond", 5000);

    expect(callback.calls.count()).toEqual(1);
    expect(callback.calls.first().args[1]).toBe(undefined);

    request.cleanup();
  });
});
