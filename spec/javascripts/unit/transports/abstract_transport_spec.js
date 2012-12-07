describe("AbstractTransport", function() {
  function getTransport(key, options) {
    options = Pusher.Util.extend({
      encrypted: false,
      host: "example.com",
      unencryptedPort: 12345,
      encryptedPort: 54321
    }, options);

    return new Pusher.AbstractTransport(key || "foo", options);
  };

  beforeEach(function() {
    this.socket = {};
    this.transport = getTransport("foo");
    this.transport.initialize();

    spyOn(this.transport, "createSocket").andReturn(this.socket);
  });

  describe("on initialize", function() {
    it("should emit 'initialized' immediately", function() {
      var onInitialized = jasmine.createSpy("onInitialized");
      this.transport.bind("initialized", onInitialized);

      this.transport.initialize();
      expect(onInitialized).toHaveBeenCalled();
    });
  });

  describe("on connect", function() {
    it("should create a unencrypted connection", function() {
      this.transport.initialize();
      this.transport.connect();
      expect(this.transport.createSocket)
        .toHaveBeenCalledWith(
          "ws://example.com:12345/app/foo" +
          "?protocol=5&client=js&version=<VERSION>"
        );
    });

    it("should create an encrypted connection", function() {
      var transport = new getTransport("bar", { encrypted: true });
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
  });

  describe("after receiving a message", function() {
    it("should emit message event with received object", function() {
      var onMessage = jasmine.createSpy("onMessage");
      this.transport.bind("message", onMessage);

      this.transport.connect();
      this.socket.onopen();
      this.socket.onmessage("ugabuga");

      expect(this.transport.state).toEqual("open");
      expect(onMessage).toHaveBeenCalledWith("ugabuga");
    });
  });

  describe("on send", function() {
    it("should defer sending data to the socket", function() {
      var sendCalled = false;
      this.socket.send = jasmine.createSpy("send").andCallFake(function() {
        sendCalled = true;
      });

      runs(function() {
        this.transport.connect();
        this.socket.onopen();

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
  });

  describe("after receiving an error", function() {
    it("should emit error and closed events", function() {
      var onError = jasmine.createSpy("onError");
      var onClosed = jasmine.createSpy("onClosed");
      this.transport.bind("error", onError);
      this.transport.bind("closed", onClosed);

      this.transport.connect();
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
  });

  describe("on close", function() {
    it("should call close on the socket and emit a 'closed' event", function() {
      this.transport.connect();
      this.socket.onopen();

      var onClosed = jasmine.createSpy("onClosed");
      this.socket.close = jasmine.createSpy("close");
      this.transport.bind("closed", onClosed);

      this.transport.close();
      expect(this.socket.close).toHaveBeenCalled();

      this.socket.onclose();
      expect(onClosed).toHaveBeenCalled();
    });
  });
});
