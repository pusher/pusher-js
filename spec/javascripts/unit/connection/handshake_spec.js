describe("Handshake", function() {
  var transport;
  var callback;
  var handshake;

  beforeEach(function() {
    transport = Pusher.Mocks.getTransport();
    callback = jasmine.createSpy("callback");
    spyOn(Pusher.Protocol, "processHandshake");

    handshake = new Pusher.Handshake(transport, callback);
  });

  it("should use Protocol.processHandshake to process first received message", function() {
    transport.emit("message", { data: "dummy" });
    expect(Pusher.Protocol.processHandshake).toHaveBeenCalledWith({
      data: "dummy"
    });
  });

  describe("after a successful handshake", function() {
    beforeEach(function() {
      Pusher.Protocol.processHandshake.andReturn({
        action: "connected",
        id: "9.9"
      });
      transport.emit("message", { data: "dummy" });
    });

    it("should call back with a connection", function() {
      expect(callback).toHaveBeenCalledWith({
        action: "connected",
        transport: transport,
        connection: jasmine.any(Pusher.Connection)
      });
      expect(callback.calls[0].args[0].connection.id).toEqual("9.9");
    });

    it("should not call close on the transport", function() {
      expect(transport.close).not.toHaveBeenCalled();
    });
  });

  describe("after a handshake with other action", function() {
    beforeEach(function() {
      Pusher.Protocol.processHandshake.andReturn({
        action: "boom",
        error: "BOOM"
      });
      transport.emit("message", { data: "dummy "});
    });

    it("should call back with correct action and error", function() {
      expect(callback).toHaveBeenCalledWith({
        action: "boom",
        transport: transport,
        error: "BOOM"
      });
    });

    it("should call close on the transport", function() {
      expect(transport.close).toHaveBeenCalled();
    });
  });

  describe("after a handshake raising an exception", function() {
    beforeEach(function() {
      Pusher.Protocol.processHandshake.andThrow("Invalid handshake");
      transport.emit("message", { data: "dummy "});
    });

    it("should call back with an 'error' action", function() {
      expect(callback).toHaveBeenCalledWith({
        action: "error",
        transport: transport,
        error: "Invalid handshake"
      });
    });

    it("should call close on the transport", function() {
      expect(transport.close).toHaveBeenCalled();
    });
  });

  describe("after receiving a 'closed' event from transport", function() {
    describe("with defined action", function() {
      beforeEach(function() {
        spyOn(Pusher.Protocol, "getCloseAction").andReturn("boo");
        spyOn(Pusher.Protocol, "getCloseError");

        transport.emit("closed", {
          code: 4321,
          reason: "test"
        });
      });

      it("should call back with correct action and error", function() {
        expect(callback).toHaveBeenCalledWith({
          action: "boo",
          transport: transport
        });
      });

      it("should not close the transport", function() {
        expect(transport.close).not.toHaveBeenCalled();
      });

      it("should call protocol methods with correct arguments", function() {
        expect(Pusher.Protocol.getCloseAction).toHaveBeenCalledWith({
          code: 4321,
          reason: "test"
        });
      });
    });

    describe("with null action", function() {
      beforeEach(function() {
        spyOn(Pusher.Protocol, "getCloseAction").andReturn(null);
        spyOn(Pusher.Protocol, "getCloseError").andReturn("???");

        transport.emit("closed", {
          code: 4321,
          reason: "???"
        });
      });

      it("should call back with 'backoff' action and error", function() {
        expect(callback).toHaveBeenCalledWith({
          action: "backoff",
          error: "???",
          transport: transport
        });
      });
    });
  });
});
