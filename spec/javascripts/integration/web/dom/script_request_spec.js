var Pusher = require('pusher_integration');
window.Pusher = Pusher;

var Integration = require('integration');
var ScriptRequest = require('dom/script_request').default;


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

  it("should send a request and receive a correct response", function() {
    runs(function() {
      request.send(receiver);
    });
    waitsFor(function() {
      return callback.calls.length > 0;
    }, "endpoint to respond", 5000);
    runs(function() {
      expect(callback.calls.length).toEqual(1);
      expect(callback).toHaveBeenCalledWith(null, { param: "test" });
    });
  });

  it("should allow cleaning up", function() {
    var callback = jasmine.createSpy();
    var receiver = Pusher.Integration.ScriptReceivers.create(callback);
    var query = "receiver=" + receiver.name;
    var url = Integration.API_URL + "/v2/script_request/echo?" + query;

    var request = new ScriptRequest(url);

    runs(function() {
      expect(document.getElementById(receiver.id)).toBe(null);
      expect(document.getElementById(receiver.id + "_error")).toBe(null);
      request.send(receiver);
      // we don't test for the _error tag, because it's Opera-specific
      expect(document.getElementById(receiver.id)).not.toBe(null);
    });
    waitsFor(function() {
      return callback.calls.length > 0;
    }, "endpoint to respond", 5000);
    runs(function() {
      expect(document.getElementById(receiver.id)).not.toBe(null);
      request.cleanup();
      expect(document.getElementById(receiver.id)).toBe(null);
      expect(document.getElementById(receiver.id + "_error")).toBe(null);
    });
  });

  it("should call back without result on a 404 response", function() {
    var url = Integration.API_URL + "/jsonp/404/" + receiver.number;
    var request = new ScriptRequest(url);

    runs(function() {
      request.send(receiver);
    });
    waitsFor(function() {
      return callback.calls.length > 0;
    }, "endpoint to respond", 5000);
    runs(function() {
      expect(callback.calls.length).toEqual(1);
      expect(callback.calls[0].args[1]).toBe(undefined);
      request.cleanup();
    });
  });

  it("should call back without result on a 500 response", function() {
    var url = Integration.API_URL + "/jsonp/500/" + receiver.number;
    var request = new ScriptRequest(url);

    runs(function() {
      request.send(receiver);
    });
    waitsFor(function() {
      return callback.calls.length > 0;
    }, "endpoint to respond", 5000);
    runs(function() {
      expect(callback.calls.length).toEqual(1);
      expect(callback.calls[0].args[1]).toBe(undefined);
      request.cleanup();
    });
  });
});
