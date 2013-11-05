describe("HTTPStreamer", function() {
  var _HTTPCORSRequest = Pusher.HTTPCORSRequest;
  var _HTTPXDomainRequest = Pusher.HTTPXDomainRequest;

  var onOpen, onMessage, onClose;
  var lastRequest;
  var stream;
  var streamer;

  beforeEach(function() {
    spyOn(Pusher, "HTTPCORSRequest").andCallFake(function(method, url) {
      lastRequest = Pusher.Mocks.getHTTPRequest(method, url);
      return lastRequest;
    });
    jasmine.Clock.useMock();

    streamer = new Pusher.HTTPStreamer("http://example.com/pusher");
    stream = streamer.stream;

    onOpen = jasmine.createSpy("onOpen");
    onMessage = jasmine.createSpy("onMessage");
    onClose = jasmine.createSpy("onClose");

    streamer.onopen = onOpen;
    streamer.onmessage = onMessage;
    streamer.onclose = onClose;
  });

  afterEach(function() {
    streamer.close();

    Pusher.HTTPCORSRequest = _HTTPCORSRequest;
    Pusher.HTTPXDomainRequest = _HTTPXDomainRequest;
  });

  it("should use HTTPCORSRequest if possible", function() {
    Pusher.HTTPXDomainRequest = undefined;

    var streamer = new Pusher.HTTPStreamer("http://example.com");
    expect(Pusher.HTTPCORSRequest).toHaveBeenCalled();

    streamer.close();
  });

  it("should use HTTPXDomainRequest if HTTPCORSRequest is not present", function() {
    Pusher.HTTPCORSRequest = undefined;
    spyOn(Pusher, "HTTPXDomainRequest").andCallFake(Pusher.Mocks.getHTTPRequest);

    var streamer = new Pusher.HTTPStreamer("http://example.com");
    expect(Pusher.HTTPXDomainRequest).toHaveBeenCalled();

    streamer.close();
  });

  it("should send a POST request to a correct URL", function() {
    var streamer = new Pusher.HTTPStreamer("http://example.com/prefix?arg=val");
    var stream = streamer.stream;

    expect(stream.method).toEqual("POST");
    expect(stream.url).toMatch(
      /^http:\/\/example\.com\/prefix\/[0-9]{1,3}\/[0-9a-z]{8}\/xhr_streaming\?arg=val&t=[0-9]+&n=[0-9]+$/
    );

    streamer.close();
  });

  it("should start streaming immediately", function() {
    expect(stream.start).toHaveBeenCalled();
  });

  it("should start streaming from different URLs", function() {
    var streamer1 = new Pusher.HTTPStreamer("http://example.com");
    var url1 = lastRequest.url;
    var streamer2 = new Pusher.HTTPStreamer("http://example.com");
    var url2 = lastRequest.url;

    expect(url1).not.toEqual(url2);
  });

  describe("on HTTP request start exception", function() {
    var onError;

    beforeEach(function() {
      // close the default streamer
      streamer.close();

      Pusher.HTTPCORSRequest.andCallFake(function() {
        var request = Pusher.Mocks.getHTTPRequest();
        request.start.andThrow("start exception");
        return request;
      });

      onError = jasmine.createSpy("onError");
      onClose = jasmine.createSpy("onClose");

      streamer = new Pusher.HTTPStreamer("http://example.com");
      streamer.onerror = onError;
      streamer.onclose = onClose;

      stream = streamer.stream;
    });

    it("should raise an error", function() {
      expect(onError).not.toHaveBeenCalled();
      jasmine.Clock.tick(1);
      expect(onError).toHaveBeenCalledWith("start exception");
    });

    it("should close itself with code 1006", function() {
      expect(onClose).not.toHaveBeenCalled();
      jasmine.Clock.tick(1);
      expect(onClose).toHaveBeenCalledWith({
        code: 1006,
        reason: "Could not start streaming",
        wasClean: false
      });
    });

    it("should unbind all listeners from the stream", function() {
      spyOn(stream, "unbind_all");
      jasmine.Clock.tick(1);
      expect(stream.unbind_all).toHaveBeenCalled();
    });

    it("should close the stream", function() {
      jasmine.Clock.tick(1);
      expect(stream.close).toHaveBeenCalled();
    });

    it("should stop the activity check", function() {
      var requestCount = Pusher.HTTPCORSRequest.calls.length;
      jasmine.Clock.tick(100000);
      expect(Pusher.HTTPCORSRequest.calls.length).toEqual(requestCount);
    });
  });

  describe("#close", function() {
    it("should close itself with supplied code and reason", function() {
      streamer.close(2013, "test reason");
      expect(onClose).toHaveBeenCalledWith({
        code: 2013,
        reason: "test reason",
        wasClean: true
      });
    });

    it("should unbind all listeners from the stream", function() {
      spyOn(stream, "unbind_all");
      streamer.close(2013, "test reason");
      expect(stream.unbind_all).toHaveBeenCalled();
    });

    it("should close the stream", function() {
      streamer.close(2013, "test reason");
      expect(stream.close).toHaveBeenCalled();
    });

    it("should stop the activity check", function() {
      streamer.close(2013, "test reason");
      expect(Pusher.HTTPCORSRequest.calls.length).toEqual(1);
      jasmine.Clock.tick(100000);
      expect(Pusher.HTTPCORSRequest.calls.length).toEqual(1);
    });
  });

  describe("before connecting", function() {
    describe("#send", function() {
      it("should return false", function() {
        expect(streamer.send("test")).toEqual(false);
      });

      it("should not trigger any HTTP requests", function() {
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(1);
        streamer.send("test");
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(1);
      });
    });
  });

  describe("when connecting", function() {
    describe("before the open frame", function() {
      it("should ignore heartbeat frames", function() {
        var requestCount = Pusher.HTTPCORSRequest.calls.length;
        stream.emit("chunk", { status: 200, data: "hhhhhhhhhhh" });
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(requestCount);
      });
    });

    describe("on the open frame", function() {
      it("should emit an 'open' event", function() {
        stream.emit("chunk", { status: 200, data: "o" });
        expect(onOpen).toHaveBeenCalled();
      });
    });
  });

  describe("after opening without hostname binding", function() {
    beforeEach(function() {
      stream.emit("chunk", { status: 200, data: "hhhhhhhhhhh" });
      stream.emit("chunk", { status: 200, data: "o" });
    });

    describe("#send", function() {
      it("should send an HTTP request to a correct URL", function() {
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(1);
        streamer.send("test");

        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(2);
        expect(lastRequest.method).toEqual("POST");
        expect(lastRequest.url).toMatch(
          new RegExp(
            "^http:\\/\\/example\\.com\\/pusher\\/" +
            streamer.session +
            "\\/xhr_send\\?t=[0-9]+&n=[0-9]+$"
          )
        );
      });

      it("should send a string payload", function() {
        var data = "test";
        streamer.send(data);
        expect(JSON.parse(lastRequest.start.calls[0].args[0])).toEqual([data]);
      });

      it("should send an array payload", function() {
        var data = ["test", 1, { foo: "bar" }];
        streamer.send(data);
        expect(JSON.parse(lastRequest.start.calls[0].args[0])).toEqual([data]);
      });

      it("should send an object payload", function() {
        var data = { num: 1, str: "data", arr: [1, 2, 3]};
        streamer.send(data);
        expect(JSON.parse(lastRequest.start.calls[0].args[0])).toEqual([data]);
      });

      it("should return true if the request did not raise an exception", function() {
        expect(streamer.send("test")).toBe(true);
      });

      it("should return false if the request raised an exception", function() {
        Pusher.HTTPCORSRequest.andCallFake(function() {
          var request = Pusher.Mocks.getHTTPRequest();
          request.start.andThrow("exception");
          return request;
        });

        expect(streamer.send("test")).toBe(false);
      });

      it("should send messages to different URLs", function() {
        streamer.send("test");
        var url1 = lastRequest.url;
        streamer.send("test");
        var url2 = lastRequest.url;
        expect(url1).not.toEqual(url2);
      });
    });

    describe("on a single-message frame", function() {
      it("should emit the message if status is 200", function() {
        stream.emit("chunk", { status: 200, data: 'm{"foo": 123}' });
        expect(onMessage).toHaveBeenCalledWith({ data: { foo: 123 } });
      });

      it("should not emit the message if status is not 200", function() {
        stream.emit("chunk", { status: 400, data: 'm[]' });
        expect(onMessage).not.toHaveBeenCalled();
      });
    });

    describe("on a multi-message frame", function() {
      it("should emit all messages if status is 200", function() {
        stream.emit("chunk", { status: 200, data: 'a[1,2,3]' });
        expect(onMessage.calls[0].args[0]).toEqual({ data: 1 });
        expect(onMessage.calls[1].args[0]).toEqual({ data: 2 });
        expect(onMessage.calls[2].args[0]).toEqual({ data: 3 });
      });

      it("should not emit any messages if status is not 200", function() {
        stream.emit("chunk", { status: 400, data: 'a[1,2,3]' });
        expect(onMessage).not.toHaveBeenCalled();
      });
    });

    describe("on a heartbeat frame", function() {
      it("should respond with an empty frame", function() {
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(1);

        stream.emit("chunk", { status: 200, data: 'h' });

        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(2);
        expect(lastRequest.method).toEqual("POST");
        expect(lastRequest.url).toMatch(
          new RegExp(
            "^http:\\/\\/example\\.com\\/pusher\\/" +
            streamer.session +
            "\\/xhr_send\\?t=[0-9]+&n=[0-9]+$"
          )
        );
        expect(JSON.parse(lastRequest.start.calls[0].args[0])).toEqual(["[]"]);
      });
    });

    describe("on a close frame", function() {
      it("should call onclose with the code and the reason", function() {
        stream.emit("chunk", { status: 200, data: 'c[1234, "testing"]' });

        expect(onClose).toHaveBeenCalledWith({
          code: 1234,
          reason: "testing",
          wasClean: true
        });
      });

      it("should unbind all listeners from the stream", function() {
        spyOn(stream, "unbind_all");
        stream.emit("chunk", { status: 200, data: 'c[1234, "testing"]' });
        expect(stream.unbind_all).toHaveBeenCalled();
      });

      it("should close the stream", function() {
        stream.emit("chunk", { status: 200, data: 'c[1234, "testing"]' });
        expect(stream.close).toHaveBeenCalled();
      });

      it("should stop the activity check", function() {
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(1);
        stream.emit("chunk", { status: 200, data: 'c[1234, "testing"]' });
        jasmine.Clock.tick(100000);
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(1);
      });
    });

    describe("after 30s of inactivity", function() {
      it("should send a heartbeat", function() {
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(1);
        jasmine.Clock.tick(29999);
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(1);
        jasmine.Clock.tick(1);
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(2);

        expect(lastRequest.method).toEqual("POST");
        expect(lastRequest.url).toMatch(
          new RegExp(
            "^http:\\/\\/example\\.com\\/pusher\\/" +
            streamer.session +
            "\\/xhr_send\\?t=[0-9]+&n=[0-9]+$"
          )
        );
        expect(lastRequest.start).toHaveBeenCalledWith("h");
      });
    });

    describe("after a activity check response", function() {
      it("should not close the connection", function() {
        jasmine.Clock.tick(44999);
        stream.emit("chunk", { status: 200, data: "a[]" });
        jasmine.Clock.tick(30000);
      });

      it("should delay the next activity check", function() {
        jasmine.Clock.tick(44999);
        stream.emit("chunk", { status: 200, data: "a[]" });

        jasmine.Clock.tick(29999);
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(2);

        jasmine.Clock.tick(1);
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(3);

        expect(lastRequest.method).toEqual("POST");
        expect(lastRequest.url).toMatch(
          new RegExp(
            "^http:\\/\\/example\\.com\\/pusher\\/" +
            streamer.session +
            "\\/xhr_send\\?t=[0-9]+&n=[0-9]+$"
          )
        );
        expect(lastRequest.start).toHaveBeenCalledWith("h");
      });
    });

    describe("after 45s of inactivity", function() {
      it("should close the connection", function() {
        jasmine.Clock.tick(44999);
        expect(onClose).not.toHaveBeenCalled();

        jasmine.Clock.tick(1);
        expect(onClose).toHaveBeenCalledWith({
          code: 1006,
          reason: "Did not receive a heartbeat response",
          wasClean: false
        });
      });

      it("should unbind all listeners from the stream", function() {
        spyOn(stream, "unbind_all");
        jasmine.Clock.tick(45000);
        expect(stream.unbind_all).toHaveBeenCalled();
      });

      it("should close the stream", function() {
        jasmine.Clock.tick(45000);
        expect(stream.close).toHaveBeenCalled();
      });

      it("should stop the activity check", function() {
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(1);
        jasmine.Clock.tick(30000);
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(2);
        jasmine.Clock.tick(100000);
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(2);
      });
    });

    describe("on any message", function() {
      it("should delay the next activity check", function() {
        jasmine.Clock.tick(10000);
        stream.emit("chunk", { status: 200, data: "x" });

        jasmine.Clock.tick(29999);
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(1);

        jasmine.Clock.tick(1);
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(2);

        expect(lastRequest.method).toEqual("POST");
        expect(lastRequest.url).toMatch(
          new RegExp(
            "^http:\\/\\/example\\.com\\/pusher\\/" +
            streamer.session +
            "\\/xhr_send\\?t=[0-9]+&n=[0-9]+$"
          )
        );
        expect(lastRequest.start).toHaveBeenCalledWith("h");
      });
    });
  });

  describe("after opening with hostname binding", function() {
    beforeEach(function() {
      stream.emit("chunk", { status: 200, data: "hhhhhhhhhhhhhhhhh" });
      stream.emit("chunk", { status: 200, data: 'o{"hostname":"example.org"}'});
    });

    describe("#send", function() {
      it("should send an HTTP request to the updated host", function() {
        streamer.send("test");
        // opening the connection sends the first request
        expect(Pusher.HTTPCORSRequest.calls.length).toEqual(2);
        expect(lastRequest.method).toEqual("POST");
        expect(lastRequest.url).toMatch(
          new RegExp(
            "^http:\\/\\/example\\.org\\/pusher\\/" +
            streamer.session +
            "\\/xhr_send\\?t=[0-9]+&n=[0-9]+$"
          )
        );
      });
    });
  });
});
