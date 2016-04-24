var TestEnv = require('testenv');
var Mocks = require('mocks');
var Util = require('core/util').default;
var HTTPSocket = require('core/http/http_socket').default;
var Runtime = require('runtime').default;

describe("HTTP.Socket", function() {
  var onOpen, onMessage, onActivity, onClose;
  var hooks;

  var lastXHR;
  var socket;

  var HTTPFactory;

  beforeEach(function() {
    HTTPFactory = require('runtime').default.HTTPFactory;
    jasmine.Clock.useMock();

    spyOn(HTTPFactory, "createXHR").andCallFake(function(method, url) {
      lastXHR = Mocks.getHTTPRequest(method, url);
      return lastXHR;
    });

    if (TestEnv === "web") {
      spyOn(HTTPFactory, "createXDR").andCallFake(function(method, url) {
        lastXHR = Mocks.getHTTPRequest(method, url);
        return lastXHR;
      });
    }

    spyOn(Runtime, "isXHRSupported").andReturn(true);
    if (TestEnv === "web") spyOn(Runtime, "isXDRSupported").andReturn(false);

    hooks = {
      getReceiveURL: jasmine.createSpy().andCallFake(function(url, session) {
        return url.base + "/" + session + url.queryString;
      }),
      onHeartbeat: jasmine.createSpy(),
      sendHeartbeat: jasmine.createSpy(),
      onFinished: jasmine.createSpy()
    };
    socket = new HTTPSocket(hooks, "http://example.com/pusher");

    onOpen = jasmine.createSpy("onOpen");
    onMessage = jasmine.createSpy("onMessage");
    onActivity = jasmine.createSpy("onActivity");
    onClose = jasmine.createSpy("onClose");

    socket.onopen = onOpen;
    socket.onmessage = onMessage;
    socket.onactivity = onActivity;
    socket.onclose = onClose;
  });

  afterEach(function() {
    socket.close();
  });

  it("should use XHR if it's supported", function() {
    Runtime.isXHRSupported.andReturn(true);
    if (TestEnv === "web" ) Runtime.isXDRSupported.andReturn(false);

    var socket = new HTTPSocket(hooks, "http://example.com");
    expect(HTTPFactory.createXHR).toHaveBeenCalled();
    socket.close();
  });

  if (TestEnv === "web") {
    it("should use XDR if it's supported", function() {
      Runtime.isXHRSupported.andReturn(false);
      Runtime.isXDRSupported.andReturn(true);

      var socket = new HTTPSocket(hooks, "http://example.com");
      expect(HTTPFactory.createXDR).toHaveBeenCalled();

      socket.close();
    });
  }

  it("should send a POST request to the URL constructed with getReceiveURL", function() {
    var socket = new HTTPSocket(hooks, "http://example.com/x?arg=val");

    expect(lastXHR.method).toEqual("POST");
    expect(lastXHR.url).toMatch(
      /^http:\/\/example\.com\/x\/[0-9]{1,3}\/[0-9a-z]{8}\?arg=val&t=[0-9]+&n=[0-9]+$/
    );

    socket.close();
  });

  it("should start streaming immediately", function() {
    expect(lastXHR.start).toHaveBeenCalled();
  });

  it("should start streaming from different URLs", function() {
    var socket1 = new HTTPSocket(hooks, "http://example.com");
    var url1 = lastXHR.url;
    var socket2 = new HTTPSocket(hooks, "http://example.com");
    var url2 = lastXHR.url;

    expect(url1).not.toEqual(url2);
  });

  describe("on HTTP request start exception", function() {
    var onError;
    var stream;

    beforeEach(function() {
      // close the default socket
      socket.close();

      HTTPFactory.createXHR.andCallFake(function() {
        stream = Mocks.getHTTPRequest();
        stream.start.andThrow("start exception");
        return stream;
      });

      onError = jasmine.createSpy("onError");
      onClose = jasmine.createSpy("onClose");

      socket = new HTTPSocket(hooks, "http://example.com");
      socket.onerror = onError;
      socket.onclose = onClose;
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
  });

  describe("#ping", function() {
    it("should call the sendHeartbeat hook", function() {
      expect(hooks.sendHeartbeat).not.toHaveBeenCalledWith(socket);
      socket.ping();
      expect(hooks.sendHeartbeat).toHaveBeenCalledWith(socket);
    });
  });

  describe("#close", function() {
    it("should close itself with supplied code and reason", function() {
      socket.close(2013, "test reason");
      expect(onClose).toHaveBeenCalledWith({
        code: 2013,
        reason: "test reason",
        wasClean: true
      });
    });

    it("should unbind all listeners from the stream", function() {
      spyOn(lastXHR, "unbind_all");
      socket.close(2013, "test reason");
      expect(lastXHR.unbind_all).toHaveBeenCalled();
    });

    it("should close the stream", function() {
      socket.close(2013, "test reason");
      expect(lastXHR.close).toHaveBeenCalled();
    });
  });

  describe("before connecting", function() {
    describe("#send", function() {
      it("should return false", function() {
        expect(socket.send("test")).toEqual(false);
      });

      it("should not trigger any HTTP requests", function() {
        expect(HTTPFactory.createXHR.calls.length).toEqual(1);
        socket.send("test");
        expect(HTTPFactory.createXHR.calls.length).toEqual(1);
      });
    });
  });

  describe("when connecting", function() {
    describe("before the open frame", function() {
      it("should ignore heartbeat frames", function() {
        var requestCount = HTTPFactory.createXHR.calls.length;
        lastXHR.emit("chunk", { status: 200, data: "hhhhhhhhhhh" });
        expect(HTTPFactory.createXHR.calls.length).toEqual(requestCount);
      });
    });

    describe("on the open frame", function() {
      it("should emit an 'open' event", function() {
        lastXHR.emit("chunk", { status: 200, data: "o" });
        expect(onOpen).toHaveBeenCalled();
      });
    });
  });

  describe("after opening without hostname binding", function() {
    beforeEach(function() {
      lastXHR.emit("chunk", { status: 200, data: "hhhhhhhhhhh" });
      lastXHR.emit("chunk", { status: 200, data: "o" });
    });

    describe("#send", function() {
      it("should send an HTTP request to a correct URL", function() {
        expect(HTTPFactory.createXHR.calls.length).toEqual(1);
        socket.send("test");

        expect(HTTPFactory.createXHR.calls.length).toEqual(2);
        expect(lastXHR.method).toEqual("POST");
        expect(lastXHR.url).toMatch(
          new RegExp(
            "^http:\\/\\/example\\.com\\/pusher\\/" +
            socket.session +
            "\\/xhr_send\\?t=[0-9]+&n=[0-9]+$"
          )
        );
      });

      it("should send a string payload", function() {
        var data = "test";
        socket.send(data);
        expect(JSON.parse(lastXHR.start.calls[0].args[0])).toEqual([data]);
      });

      it("should send an array payload", function() {
        var data = ["test", 1, { foo: "bar" }];
        socket.send(data);
        expect(JSON.parse(lastXHR.start.calls[0].args[0])).toEqual([data]);
      });

      it("should send an object payload", function() {
        var data = { num: 1, str: "data", arr: [1, 2, 3]};
        socket.send(data);
        expect(JSON.parse(lastXHR.start.calls[0].args[0])).toEqual([data]);
      });

      it("should return true if the request did not raise an exception", function() {
        expect(socket.send("test")).toBe(true);
      });

      it("should return false if the request raised an exception", function() {
        HTTPFactory.createXHR.andCallFake(function() {
          var request = Mocks.getHTTPRequest();
          request.start.andThrow("exception");
          return request;
        });

        expect(socket.send("test")).toBe(false);
      });

      it("should send messages to different URLs", function() {
        socket.send("test");
        var url1 = lastXHR.url;
        socket.send("test");
        var url2 = lastXHR.url;
        expect(url1).not.toEqual(url2);
      });
    });

    describe("on a single-message frame", function() {
      it("should emit the message if status is 200", function() {
        lastXHR.emit("chunk", { status: 200, data: 'm{"foo": 123}' });
        expect(onMessage).toHaveBeenCalledWith({ data: { foo: 123 } });
      });

      it("should not emit the message if status is not 200", function() {
        lastXHR.emit("chunk", { status: 400, data: 'm[]' });
        expect(onMessage).not.toHaveBeenCalled();
      });
    });

    describe("on a multi-message frame", function() {
      it("should emit all messages if status is 200", function() {
        lastXHR.emit("chunk", { status: 200, data: 'a[1,2,3]' });
        expect(onMessage.calls[0].args[0]).toEqual({ data: 1 });
        expect(onMessage.calls[1].args[0]).toEqual({ data: 2 });
        expect(onMessage.calls[2].args[0]).toEqual({ data: 3 });
      });

      it("should not emit any messages if status is not 200", function() {
        lastXHR.emit("chunk", { status: 400, data: 'a[1,2,3]' });
        expect(onMessage).not.toHaveBeenCalled();
      });
    });

    describe("on a heartbeat frame", function() {
      it("should call the onHeartbeat hook", function() {
        lastXHR.emit("chunk", { status: 200, data: 'h' });
        expect(hooks.onHeartbeat).toHaveBeenCalledWith(socket);
      });
    });

    describe("on a close frame", function() {
      it("should call onclose with the code and the reason", function() {
        lastXHR.emit("chunk", { status: 200, data: 'c[1234, "testing"]' });

        expect(onClose).toHaveBeenCalledWith({
          code: 1234,
          reason: "testing",
          wasClean: true
        });
      });

      it("should unbind all listeners from the stream", function() {
        spyOn(lastXHR, "unbind_all");
        lastXHR.emit("chunk", { status: 200, data: 'c[1234, "testing"]' });
        expect(lastXHR.unbind_all).toHaveBeenCalled();
      });

      it("should close the stream", function() {
        lastXHR.emit("chunk", { status: 200, data: 'c[1234, "testing"]' });
        expect(lastXHR.close).toHaveBeenCalled();
      });
    });

    describe("on any chunk", function() {
      it("should call onactivity", function() {
        expect(onActivity).not.toHaveBeenCalled();
        lastXHR.emit("chunk", { status: 200, data: "x" });
        expect(onActivity).toHaveBeenCalled();
      });
    });
  });

  describe("after opening with hostname binding", function() {
    beforeEach(function() {
      lastXHR.emit("chunk", { status: 200, data: "hhhhhhhhhhhhhhhhh" });
      lastXHR.emit("chunk", { status: 200, data: 'o{"hostname":"example.org"}'});
    });

    describe("#send", function() {
      it("should send an HTTP request to the updated host", function() {
        socket.send("test");
        // opening the connection sends the first request
        expect(HTTPFactory.createXHR.calls.length).toEqual(2);
        expect(lastXHR.method).toEqual("POST");
        expect(lastXHR.url).toMatch(
          new RegExp(
            "^http:\\/\\/example\\.org\\/pusher\\/" +
            socket.session +
            "\\/xhr_send\\?t=[0-9]+&n=[0-9]+$"
          )
        );
      });
    });
  });
});
