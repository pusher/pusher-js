const Pusher = require('pusher_integration');
window.Pusher = Pusher;

const Integration = require('integration');
const ScriptRequest = require('dom/script_request').default;
const waitsFor = require('../../../helpers/waitsFor');

Integration.describe("ScriptRequest", function() {
  var callback, receiver;
  var query, url;
  var request;
  var ScriptReceivers;

  beforeEach(function() {
    callback = jasmine.createSpy();
    receiver = Pusher.Integration.ScriptReceivers.create(callback);
    query = "receiver=" + receiver.name + "&param=test";
    url = Integration.API_URL + "/v2/script_request/echo?" + query;
    request = new ScriptRequest(url);
  });

  afterEach(function(){
    request.cleanup();
  });

  it("should send a request and receive a correct response", async function() {
    request.send(receiver);

    await waitsFor(function() {
      return callback.calls.count() > 0;
    }, "endpoint to respond", 5000);

    expect(callback.calls.count()).toEqual(1);
    expect(callback).toHaveBeenCalledWith(null, { param: "test" });
  });

  it("should allow cleaning up", async function() {
    var callback = jasmine.createSpy();
    var receiver = Pusher.Integration.ScriptReceivers.create(callback);
    var query = "receiver=" + receiver.name;
    var url = Integration.API_URL + "/v2/script_request/echo?" + query;

    var request = new ScriptRequest(url);

    expect(document.getElementById(receiver.id)).toBe(null);
    expect(document.getElementById(receiver.id + "_error")).toBe(null);
    request.send(receiver);
    // we don't test for the _error tag, because it's Opera-specific
    expect(document.getElementById(receiver.id)).not.toBe(null);

    await waitsFor(function() {
      return callback.calls.count() > 0;
    }, "endpoint to respond", 5000);

    expect(document.getElementById(receiver.id)).not.toBe(null);
    request.cleanup();
    expect(document.getElementById(receiver.id)).toBe(null);
    expect(document.getElementById(receiver.id + "_error")).toBe(null);
  });

  it("should call back without result on a 404 response", async function() {
    var url = Integration.API_URL + "/jsonp/404/" + receiver.number;
    var request = new ScriptRequest(url);

    request.send(receiver);

    await waitsFor(function() {
      return callback.calls.count() > 0;
    }, "endpoint to respond", 5000);

    expect(callback.calls.count()).toEqual(1);
    expect(callback.calls.first().args[1]).toBe(undefined);
    request.cleanup();
  });

  it("should call back without result on a 500 response", async function() {
    var url = Integration.API_URL + "/jsonp/500/" + receiver.number;
    var request = new ScriptRequest(url);

    request.send(receiver);

    await waitsFor(function() {
      return callback.calls.count() > 0;
    }, "endpoint to respond", 5000);

    expect(callback.calls.count()).toEqual(1);
    expect(callback.calls.first().args[1]).toBe(undefined);
    request.cleanup();
  });
});
