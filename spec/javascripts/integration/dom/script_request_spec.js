describeIntegration("ScriptRequest", function() {
  var callback, receiver;
  var query, url;
  var request;

  beforeEach(function() {
    callback = jasmine.createSpy();
    receiver = Pusher.Integration.ScriptReceivers.create(callback);
    query = "receiver=" + receiver.name + "&param=test";
    url = Pusher.Integration.API_URL + "/script_request/echo?" + query;
    request = new Pusher.ScriptRequest(url, receiver);
  });

  it("should send a request and receive a correct response", function() {
    runs(function() {
      request.send();
    });
    waitsFor(function() {
      return callback.calls.length > 0;
    }, "endpoint to respond", 5000);
    runs(function() {
      expect(callback).toHaveBeenCalledWith(null, { param: "test" });
    });
  });

  it("should allow cleaning up", function() {
    var callback = jasmine.createSpy();
    var receiver = Pusher.Integration.ScriptReceivers.create(callback);
    var query = "receiver=" + receiver.name;
    var url = Pusher.Integration.API_URL + "/script_request/echo?" + query;

    var request = new Pusher.ScriptRequest(url, receiver);

    runs(function() {
      expect(document.getElementById(receiver.id)).toBe(null);
      expect(document.getElementById(receiver.id + "_error")).toBe(null);
      request.send();
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

  it("should call back with an error on a 404 response", function() {
    var url = Pusher.Integration.API_URL + "/jsonp/404";
    var request = new Pusher.ScriptRequest(url, receiver);

    runs(function() {
      request.send();
    });
    waitsFor(function() {
      return callback.calls.length > 0;
    }, "endpoint to respond", 5000);
    runs(function() {
      expect(callback).toHaveBeenCalledWith(
        "Error loading script " + url
      );
    });
  });

  it("should call back with an error on a 500 response", function() {
    var url = Pusher.Integration.API_URL + "/jsonp/500";
    var request = new Pusher.ScriptRequest(url, receiver);

    runs(function() {
      request.send();
    });
    waitsFor(function() {
      return callback.calls.length > 0;
    }, "endpoint to respond", 5000);
    runs(function() {
      expect(callback).toHaveBeenCalledWith(
        "Error loading script " + url
      );
    });
  });
});
