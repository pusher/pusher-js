describeIntegration("JSONP", function() {
  it("should send a request and receive a correct response", function() {
    var callback = jasmine.createSpy();
    var receiver = Pusher.ScriptReceivers.create(callback);
    var url = Pusher.Integration.API_URL + "/v2/jsonp/echo";

    runs(function() {
      var request = new Pusher.JSONPRequest(url, {
        "session": 2289545,
        "features": ["ws", "flash", "sockjs"],
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
    });
    waitsFor(function() {
      return callback.calls.length > 0;
    }, "JSONP to respond", 5000);
    runs(function() {
      expect(callback.calls.length).toEqual(1);
      expect(callback).toHaveBeenCalledWith(null, {
        "session": "2289545",
        "features": ["ws", "flash", "sockjs"],
        "version": "1.13.0",
        "t0": "1355850357911",
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
    });
  });

  it("should call back without a result on 404 response", function() {
    var callback = jasmine.createSpy();
    var receiver = Pusher.ScriptReceivers.create(callback);
    var url = Pusher.Integration.API_URL + "/jsonp/404";

    runs(function() {
      var request = new Pusher.JSONPRequest(url, {});
      request.send(receiver);
    });
    waitsFor(function() {
      return callback.calls.length > 0;
    }, "JSONP to respond", 5000);
    runs(function() {
      expect(callback.calls.length).toEqual(1);
      expect(callback.calls[0].args[1]).toBe(undefined);
    });
  });

  it("should call back without a result on 500 response", function() {
    var callback = jasmine.createSpy();
    var receiver = Pusher.ScriptReceivers.create(callback);
    var url = Pusher.Integration.API_URL + "/jsonp/500";

    runs(function() {
      var request = new Pusher.JSONPRequest(url, {});
      request.send(receiver);
    });
    waitsFor(function() {
      return callback.calls.length > 0;
    }, "JSONP to respond", 5000);
    runs(function() {
      expect(callback.calls.length).toEqual(1);
      expect(callback.calls[0].args[1]).toBe(undefined);
    });
  });
});
