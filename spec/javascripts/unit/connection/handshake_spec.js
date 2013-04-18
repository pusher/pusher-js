describe("Handshake", function() {
  var transport;
  var callback;
  var handshake;

  beforeEach(function() {
    transport = Pusher.Mocks.getTransport();
    callback = jasmine.createSpy("callback");
    handshake = new Pusher.Handshake(transport, callback);
  });

  describe("after receiving 'pusher:connection_established'", function() {
    beforeEach(function() {
      transport.emit("message", {
        data: JSON.stringify({
          event: "pusher:connection_established",
          data: {
            socket_id: "123.456"
          }
        })
      });
    });

    it("should call back with a connection", function() {
      expect(callback).toHaveBeenCalledWith({
        action: "connected",
        transport: transport,
        connection: jasmine.any(Pusher.Connection)
      });
      expect(callback.calls[0].args[0].connection.id).toEqual("123.456");
    });

    it("should not call close on the transport", function() {
      expect(transport.close).not.toHaveBeenCalled();
    });
  });

  describe("after receiving 'pusher:error'", function() {
    beforeEach(function() {
      spyOn(Pusher.Protocol, "getCloseAction").andReturn("test");
      spyOn(Pusher.Protocol, "getCloseError").andReturn("err");

      transport.emit("message", {
        data: JSON.stringify({
          event: "pusher:error",
          data: {
            code: 4000,
            message: "SSL only"
          }
        })
      });
    });

    it("should call back with correct action and error", function() {
      expect(callback).toHaveBeenCalledWith({
        action: "test",
        transport: transport,
        error: "err"
      });
    });

    it("should call close on the transport", function() {
      expect(transport.close).toHaveBeenCalled();
    });

    it("should call protocol methods with correct arguments", function() {
      expect(Pusher.Protocol.getCloseAction).toHaveBeenCalledWith({
        code: 4000,
        message: "SSL only"
      });
    });
  });

  describe("after receiving a 'closed' event", function() {
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
});
