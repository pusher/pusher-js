describe("PusherWSTransport", function() {
  function getTransport(key, options) {
    key = key || "foo";
    options = Pusher.Util.extend({
      secure: false,
      host: "example.com",
      nonsecurePort: 12345,
      securePort: 54321,
      path: "/bar",
    }, options);

    return new PusherWSTransport(key, options);
  }

  beforeEach(function() {
    this.socket = {};
    this.transport = getTransport("foo");
    spyOn(window, "WebSocket").andReturn(this.socket);
  });

  describe("when opening connections", function() {
    it("should create non-secure WebSocket connection", function() {
      var transport = getTransport("foo", { secure: false });

      transport.connect();
      expect(window.WebSocket)
        .toHaveBeenCalledWith("ws://example.com:12345/bar");
    });

    it("should create secure WebSocket connection", function() {
      var transport = new getTransport("foo", { secure: true });

      transport.connect();
      expect(window.WebSocket)
        .toHaveBeenCalledWith("wss://example.com:54321/bar");
    });

    it("should change the state to 'connecting' on connection attempt", function() {
      var connectingCallback = jasmine.createSpy("connectingCallback");
      this.transport.bind("connecting", connectingCallback);

      this.transport.connect();
      expect(window.WebSocket).toHaveBeenCalled();
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
        error: "We're doomed",
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
