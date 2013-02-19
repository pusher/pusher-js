describe("AbstractTransport", function() {
  function getTransport(key, options) {
    options = Pusher.Util.extend({
      encrypted: false,
      host: "example.com",
      unencryptedPort: 12345,
      encryptedPort: 54321
    }, options);

    return new Pusher.AbstractTransport(key || "foo", options);
  }

  beforeEach(function() {
    this.socket = {};
    this.timeline = Pusher.Mocks.getTimeline();
    this.timeline.getUniqueID.andReturn(667);
    this.transport = getTransport("foo", {
      timeline: this.timeline
    });
    this.transport.name = "abstract";

    spyOn(this.transport, "createSocket").andReturn(this.socket);
  });

  describe("on initialize", function() {
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
        transport: "abstract",
        method: "initialize"
      });
    });
  });

  describe("on connect", function() {
    beforeEach(function() {
      this.transport.initialize();
    });

    it("should create an unencrypted connection", function() {
      this.transport.initialize();
      this.transport.connect();
      expect(this.transport.createSocket)
        .toHaveBeenCalledWith(
          "ws://example.com:12345/app/foo" +
          "?protocol=5&client=js&version=<VERSION>"
        );
    });

    it("should create an encrypted connection", function() {
      var transport = new getTransport("bar", {
        timeline: this.timeline,
        encrypted: true
      });
      spyOn(transport, "createSocket").andReturn({});

      transport.initialize();
      transport.connect();
      expect(transport.createSocket)
        .toHaveBeenCalledWith(
          "wss://example.com:54321/app/bar" +
          "?protocol=5&client=js&version=<VERSION>"
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
        transport: "abstract",
        method: "connect",
        url: "ws://example.com:12345/app/foo?protocol=5&client=js&version=<VERSION>"
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
        transport: "abstract",
        message: "log this"
      });
    });
  });

  describe("on send", function() {
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


    it("should log method call with debug level", function() {
      this.transport.send("foobar");
      expect(this.timeline.debug).toHaveBeenCalledWith({
        cid: 667,
        transport: "abstract",
        method: "send",
        data: "foobar"
      });
    });
  });

  describe("after receiving an error", function() {
    beforeEach(function() {
      this.transport.initialize();
      this.transport.connect();
    });

    it("should emit error and closed events", function() {
      var onError = jasmine.createSpy("onError");
      var onClosed = jasmine.createSpy("onClosed");
      this.transport.bind("error", onError);
      this.transport.bind("closed", onClosed);

      this.socket.onerror("We're doomed");
      this.socket.onclose();

      expect(onError).toHaveBeenCalledWith({
        type: "WebSocketError",
        error: "We're doomed"
      });
      expect(onError.calls.length).toEqual(1);
      expect(onClosed.calls.length).toEqual(1);
      expect(this.transport.state).toEqual("closed");
    });

    it("should log the error to timeline", function() {
      this.socket.onerror({
        name: "doom",
        number: 1,
        bool: true,
        o: { nope: true },
        f: function() {}
      });
      expect(this.timeline.error).toHaveBeenCalledWith({
        cid: 667,
        transport: "abstract",
        error: {
          name: "doom",
          number: 1,
          bool: true
        }
      });
    });
  });

  describe("on close", function() {
    beforeEach(function() {
      this.transport.initialize();
      this.transport.connect();
      this.socket.onopen();
      this.socket.close = jasmine.createSpy("close");
    });

    it("should call close on the socket and emit a 'closed' event", function() {
      var onClosed = jasmine.createSpy("onClosed");
      this.transport.bind("closed", onClosed);

      this.transport.close();
      expect(this.socket.close).toHaveBeenCalled();

      this.socket.onclose();
      expect(onClosed).toHaveBeenCalled();
    });

    it("should log method call with debug level", function() {
      this.transport.close();
      expect(this.timeline.debug).toHaveBeenCalledWith({
        cid: 667,
        transport: "abstract",
        method: "close"
      });
    });
  });

  describe("on state change", function () {
    it("should log the new state to timeline", function() {
      this.transport.initialize();

      expect(this.timeline.info.calls.length).toEqual(1);
      expect(this.timeline.info).toHaveBeenCalledWith({
        cid: 667,
        transport: "abstract",
        state: "initialized"
      });

      this.transport.connect();

      expect(this.timeline.info.calls.length).toEqual(2);
      expect(this.timeline.info).toHaveBeenCalledWith({
        cid: 667,
        transport: "abstract",
        state: "connecting"
      });
    });

    it("should append an 's' suffix for encrypted connections", function() {
      var timeline = Pusher.Mocks.getTimeline();
      timeline.getUniqueID.andReturn(11111);
      var transport = getTransport("xxx", {
        timeline: timeline,
        encrypted: true
      });
      transport.name = "abstract";
      transport.initialize();

      expect(timeline.info.calls.length).toEqual(1);
      expect(timeline.info).toHaveBeenCalledWith({
        cid: 11111,
        transport: "abstracts",
        state: "initialized"
      });
    });
  });
});
