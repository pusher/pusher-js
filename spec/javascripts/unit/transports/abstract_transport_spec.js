describe("AbstractTransport", function() {
  function getTransport(key, options) {
    options = Pusher.Util.extend({
      secure: false,
      host: "example.com",
      nonsecurePort: 12345,
      securePort: 54321
    }, options);

    return new Pusher.AbstractTransport(key || "foo", options);
  };

  beforeEach(function() {
    this.socket = {};
    this.transport = getTransport("foo");
    this.transport.initialize();

    spyOn(this.transport, "createSocket").andReturn(this.socket);
  });

  describe("when loading", function() {
    it("should emit 'initialized' immediately", function() {
      var transport = getTransport("foo", { secure: false });

      var initializedCallback = jasmine.createSpy("initializedCallback");
      transport.bind("initialized", initializedCallback);

      transport.initialize();
      expect(initializedCallback).toHaveBeenCalled();
    });
  });

  describe("when opening connections", function() {
    it("should create a non-secure connection", function() {
      var transport = getTransport("foo", { secure: false });
      spyOn(transport, "createSocket").andReturn({});

      transport.initialize();
      transport.connect();
      expect(transport.createSocket)
        .toHaveBeenCalledWith(
          "ws://example.com:12345/app/foo" +
          "?protocol=5&client=js&version=<VERSION>"
        );
    });

    it("should create a secure connection", function() {
      var transport = new getTransport("bar", { secure: true });
      spyOn(transport, "createSocket").andReturn({});

      transport.initialize();
      transport.connect();
      expect(transport.createSocket)
        .toHaveBeenCalledWith(
          "wss://example.com:54321/app/bar" +
          "?protocol=5&client=js&version=<VERSION>"
        );
    });

    it("should change the state to 'connecting' on connection attempt", function() {
      var connectingCallback = jasmine.createSpy("connectingCallback");
      this.transport.bind("connecting", connectingCallback);

      expect(this.transport.connect()).toBe(true);
      expect(this.transport.createSocket).toHaveBeenCalled();
      expect(this.transport.state).toEqual("connecting");
      expect(connectingCallback).toHaveBeenCalled();
    });

    it("should change the state to 'open' on connection open", function() {
      var openCallback = jasmine.createSpy("openCallback");
      this.transport.bind("open", openCallback);

      this.transport.connect();
      this.socket.onopen();

      expect(this.transport.state).toEqual("open");
      expect(openCallback).toHaveBeenCalled();
    });

    it("should not do anything when connection is being established", function() {
      expect(this.transport.connect()).toBe(true);
      expect(this.transport.createSocket.calls.length).toEqual(1);

      var connectingCallback = jasmine.createSpy("connectingCallback");
      this.transport.bind("connecting", connectingCallback);

      expect(this.transport.connect()).toBe(false);
      expect(this.transport.state).toEqual("connecting");
      expect(connectingCallback).not.toHaveBeenCalled();
      expect(this.transport.createSocket.calls.length).toEqual(1);
    });
  });

  describe("when receiving a message", function() {
    it("should emit received data", function() {
      var messageCallback = jasmine.createSpy("messageCallback");
      this.transport.bind("message", messageCallback);

      this.transport.connect();
      this.socket.onopen();
      this.socket.onmessage("ugabuga");

      expect(this.transport.state).toEqual("open");
      expect(messageCallback).toHaveBeenCalledWith("ugabuga");
    });
  });

  describe("when sending a message", function() {
    it("should defer passing it to the socket until this tick ends", function() {
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

  describe("when receiving an error", function() {
    it("should emit error and close events when connection fails", function() {
      var errorCallback = jasmine.createSpy("errorCallback");
      var closedCallback = jasmine.createSpy("closedCallback");
      this.transport.bind("error", errorCallback);
      this.transport.bind("closed", closedCallback);

      this.transport.connect();
      this.socket.onerror("We're doomed");
      this.socket.onclose();

      expect(errorCallback).toHaveBeenCalledWith({
        type: "WebSocketError",
        error: "We're doomed"
      });
      expect(closedCallback).toHaveBeenCalled();
      expect(this.transport.state).toEqual("closed");
    });
  });

  describe("when being closed", function() {
    it("should call close on the socket and emit a 'closed' event", function() {
      this.transport.connect();
      this.socket.onopen();

      var closedCallback = jasmine.createSpy("closedCallback");
      this.socket.close = jasmine.createSpy("close");
      this.transport.bind("closed", closedCallback);

      this.transport.close();
      expect(this.socket.close).toHaveBeenCalled();

      this.socket.onclose();
      expect(closedCallback).toHaveBeenCalled();
    });
  });
});
