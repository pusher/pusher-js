describe("AbstractTransport", function() {
  function getTransport(key, options) {
    options = Pusher.Util.extend({
      encrypted: false,
      hostUnencrypted: "example.com:12345",
      hostEncrypted: "example.com:54321"
    }, options);

    return new Pusher.AbstractTransport("abs", 7, key || "foo", options);
  }

  beforeEach(function() {
    this.socket = {
      send: jasmine.createSpy("send"),
      close: jasmine.createSpy("close")
    };
    this.timeline = Pusher.Mocks.getTimeline();
    this.timeline.generateUniqueID.andReturn(667);
    this.transport = getTransport("foo", {
      timeline: this.timeline
    });
    this.transport.name = "abstract";

    spyOn(this.transport, "createSocket").andReturn(this.socket);
  });

  describe("#activityTimeout", function() {
    it("should be set to the value passed via options", function() {
      var transport = getTransport("xxx", {
        timeline: this.timeline,
        activityTimeout: 654321
      });
      expect(transport.activityTimeout).toEqual(654321);
    });

    it("should be set to undefined if not passed via options", function() {
      var transport = getTransport("xxx", {
        timeline: this.timeline
      });
      expect(transport.activityTimeout).toBe(undefined);
    });
  });

  describe("#initialize", function() {
    it("should emit 'initialized' immediately", function() {
      var onInitialized = jasmine.createSpy("onInitialized");
      this.transport.bind("initialized", onInitialized);

      this.transport.initialize();
      expect(onInitialized).toHaveBeenCalled();
    });

    it("should log method call with debug level", function() {
      this.transport.initialize();
      expect(this.timeline.debug).toHaveBeenCalledWith({
        cid: 667,
        method: "initialize"
      });
    });

    it("should log transport name with info level", function() {
      this.transport.initialize();
      expect(this.timeline.info).toHaveBeenCalledWith({
        cid: 667,
        transport: "abstract"
      });
    });

    it("should log transport name with an 's' suffix when encrypted", function() {
      var transport = getTransport("xxx", {
        timeline: this.timeline,
        encrypted: true
      });
      transport.name = "abstract";
      transport.initialize();

      expect(this.timeline.info).toHaveBeenCalledWith({
        cid: 667,
        transport: "abstracts"
      });
    });
  });

  describe("#connect", function() {
    beforeEach(function() {
      this.transport.initialize();
    });

    it("should create an unencrypted connection", function() {
      this.transport.initialize();
      this.transport.connect();
      expect(this.transport.createSocket)
        .toHaveBeenCalledWith(
          "ws://example.com:12345/app/foo" +
          "?protocol=7&client=js&version=<VERSION>"
        );
    });

    it("should create an encrypted connection", function() {
      var transport = getTransport("bar", {
        timeline: this.timeline,
        encrypted: true
      });
      spyOn(transport, "createSocket").andReturn({});

      transport.initialize();
      transport.connect();
      expect(transport.createSocket)
        .toHaveBeenCalledWith(
          "wss://example.com:54321/app/bar" +
          "?protocol=7&client=js&version=<VERSION>"
        );
    });

    it("should transition to 'connecting'", function() {
      var onConnecting = jasmine.createSpy("onConnecting");
      this.transport.bind("connecting", onConnecting);

      expect(this.transport.connect()).toBe(true);
      expect(this.transport.createSocket).toHaveBeenCalled();
      expect(this.transport.state).toEqual("connecting");
      expect(onConnecting).toHaveBeenCalled();
    });

    it("should transition to 'open' after connection is established", function() {
      var onOpen = jasmine.createSpy("onOpen");
      this.transport.bind("open", onOpen);

      this.transport.connect();
      this.socket.onopen();

      expect(this.transport.state).toEqual("open");
      expect(onOpen).toHaveBeenCalled();
    });

    it("should not allow simultaneous connect calls", function() {
      expect(this.transport.connect()).toBe(true);
      expect(this.transport.createSocket.calls.length).toEqual(1);
      expect(this.transport.state).toEqual("connecting");

      var onConnecting = jasmine.createSpy("onConnecting");
      this.transport.bind("connecting", onConnecting);

      expect(this.transport.connect()).toBe(false);
      expect(this.transport.state).toEqual("connecting");
      expect(this.transport.createSocket.calls.length).toEqual(1);
      expect(onConnecting).not.toHaveBeenCalled();
    });

    it("should log method call with debug level", function() {
      this.transport.connect();
      expect(this.timeline.debug).toHaveBeenCalledWith({
        cid: 667,
        method: "connect",
        url: "ws://example.com:12345/app/foo?protocol=7&client=js&version=<VERSION>"
      });
    });
  });

  describe("#send", function() {
    beforeEach(function() {
      this.transport.initialize();
      this.transport.connect();
      this.socket.onopen();
    });

    it("should defer sending data to the socket", function() {
      var sendCalled = false;
      this.socket.send = jasmine.createSpy("send").andCallFake(function() {
        sendCalled = true;
      });

      runs(function() {
        expect(this.transport.send("foobar")).toBe(true);
        expect(this.socket.send).not.toHaveBeenCalled();
      });
      waitsFor(function () {
        return sendCalled;
      }, "socket.send to be called", 50);
      runs(function() {
        expect(this.socket.send).toHaveBeenCalledWith("foobar");
      });
    });

    it("should not crash when socket is closed before next tick (will log to console only)", function() {
      var timer;
      runs(function() {
        this.transport.send("foobar");

        this.transport.close();
        this.socket.onclose({ wasClean: true });

        timer = new Pusher.Timer(100, function() {});
      });
      waitsFor(function () {
        return !timer.isRunning();
      }, "timer to run", 500);
    });

    it("should log method call with debug level", function() {
      this.transport.send("foobar");
      expect(this.timeline.debug).toHaveBeenCalledWith({
        cid: 667,
        method: "send",
        data: "foobar"
      });
    });
  });

  describe("#close", function() {
    beforeEach(function() {
      this.transport.initialize();
      this.transport.connect();
      this.socket.onopen();
    });

    it("should call close on the socket and emit a 'closed' event", function() {
      var onClosed = jasmine.createSpy("onClosed");
      this.transport.bind("closed", onClosed);

      this.transport.close();
      expect(this.socket.close).toHaveBeenCalled();

      this.socket.onclose({ wasClean: true });
      expect(onClosed).toHaveBeenCalledWith({ wasClean: true });
    });

    it("should log method call with debug level", function() {
      this.transport.close();
      expect(this.timeline.debug).toHaveBeenCalledWith({
        cid: 667,
        method: "close"
      });
    });
  });

  describe("after receiving a message", function() {
    beforeEach(function() {
      this.transport.initialize();
      this.transport.connect();
      this.socket.onopen();
    });

    it("should emit message event with received object", function() {
      var onMessage = jasmine.createSpy("onMessage");
      this.transport.bind("message", onMessage);

      this.socket.onmessage("ugabuga");

      expect(this.transport.state).toEqual("open");
      expect(onMessage).toHaveBeenCalledWith("ugabuga");
    });

    it("should log the message with debug level", function() {
      this.socket.onmessage({ data: "log this" });
      expect(this.timeline.debug).toHaveBeenCalledWith({
        cid: 667,
        message: "log this"
      });
    });
  });

  describe("after receiving an error", function() {
    beforeEach(function() {
      this.transport.initialize();
      this.transport.connect();
    });

    it("should emit errors", function() {
      var onError = jasmine.createSpy("onError");
      this.transport.bind("error", onError);

      this.socket.onerror("We're doomed");

      expect(onError).toHaveBeenCalledWith({
        type: "WebSocketError",
        error: "We're doomed"
      });
      expect(onError.calls.length).toEqual(1);
    });

    it("should emit a closed event with correct params", function() {
      var onClosed = jasmine.createSpy("onClosed");
      this.transport.bind("closed", onClosed);

      this.socket.onclose({
        code: 1234,
        reason: "testing",
        wasClean: true,
        foo: "bar"
      });

      expect(onClosed).toHaveBeenCalledWith({
        code: 1234,
        reason: "testing",
        wasClean: true
      });
      expect(onClosed.calls.length).toEqual(1);
      expect(this.transport.state).toEqual("closed");
    });

    it("should emit a closed events without params when no details were provided", function() {
      var onClosed = jasmine.createSpy("onClosed");
      this.transport.bind("closed", onClosed);

      this.socket.onclose();

      expect(onClosed).toHaveBeenCalledWith(undefined);
      expect(onClosed.calls.length).toEqual(1);
    });

    it("should log an error without details to timeline", function() {
      this.socket.onerror("error message");
      expect(this.timeline.error).toHaveBeenCalledWith({ cid: 667 });
    });
  });

  describe("on state change", function () {
    it("should log the new state to timeline", function() {
      this.transport.initialize();

      // first call is the transport name
      expect(this.timeline.info.calls.length).toEqual(2);
      expect(this.timeline.info).toHaveBeenCalledWith({
        cid: 667,
        state: "initialized"
      });

      this.transport.connect();

      expect(this.timeline.info.calls.length).toEqual(3);
      expect(this.timeline.info).toHaveBeenCalledWith({
        cid: 667,
        state: "connecting"
      });
    });
  });
});
