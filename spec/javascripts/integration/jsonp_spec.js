describe("JSONP", function() {
  beforeEach(function() {
    var self = this;

    this.sender = new Pusher.JSONPSender({
      url: "http://localhost:8889/jsonp",
      receiver: Pusher.JSONP,
      tagPrefix: "_pusher_jsonp_jasmine_"
    });
  });

  it("should send a request and receive a correct response", function() {
    var response;

    runs(function() {
      this.sender.send(
        { "session": 2289545,
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
        },
        function(error, result) {
          response = result;
        }
      );
    });
    waitsFor(function() {
      return response;
    }, "JSONP to respond", 2000);
    runs(function() {
      expect(response).toEqual({
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

  it("should clean up after receiving a response", function() {
    var responded = false;
    runs(function() {
      expect(document.getElementById("_pusher_jsonp_jasmine_1")).toBe(null);
      expect(document.getElementById("_pusher_jsonp_jasmine_1_error")).toBe(null);
      this.sender.send({}, function(_, _) {
        responded = true;
      });
    });
    waitsFor(function() {
      return responded;
    }, "JSONP to respond", 2000);
    runs(function() {
      expect(document.getElementById("_pusher_jsonp_jasmine_1")).toBe(null);
      expect(document.getElementById("_pusher_jsonp_jasmine_1_error")).toBe(null);
    });
  });

  it("should fail on 404 response", function() {
    this.sender = new Pusher.JSONPSender({
      url: "http://localhost:8889/404",
      receiver: Pusher.JSONP,
      tagPrefix: "_pusher_jsonp_jasmine_"
    });

    var responded = false;
    runs(function() {
      this.sender.send({}, function(error, result) {
        expect(error).not.toBe(null);
        expect(result).toBe(undefined);
        responded = true;
      });
    });
    waitsFor(function() {
      return responded;
    }, "JSONP to fail", 2000);
  });


  it("should fail on 500 response", function() {
    this.sender = new Pusher.JSONPSender({
      url: "http://localhost:8889/500",
      receiver: Pusher.JSONP,
      tagPrefix: "_pusher_jsonp_jasmine_"
    });

    var responded = false;
    runs(function() {
      this.sender.send({}, function(error, result) {
        expect(error).not.toBe(null);
        expect(result).toBe(undefined);
        responded = true;
      });
    });
    waitsFor(function() {
      return responded;
    }, "JSONP to fail", 2000);
  });
});
