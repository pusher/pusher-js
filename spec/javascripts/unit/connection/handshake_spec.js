describe("Handshake", function() {
  var transport;
  var callback;
  var handshake;

  beforeEach(function() {
    transport = Pusher.Mocks.getTransport();
    callback = jasmine.createSpy("callback");
    handshake = new Pusher.Handshake(transport, callback);
  });

  describe("before receiving anything", function() {
    describe("#process", function() {
      it("should call the 'undefined' handler", function() {
        var onUndefined = jasmine.createSpy("onUndefined");
        var onOther = jasmine.createSpy("onOther");

        handshake.process({
          undefined: onUndefined,
          other: onOther
        });

        expect(onUndefined).toHaveBeenCalledWith();
        expect(onOther).not.toHaveBeenCalled();
      });
    });
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

    it("should call back", function() {
      expect(callback).toHaveBeenCalled();
    });

    it("should not call close on the transport", function() {
      expect(transport.close).not.toHaveBeenCalled();
    });

    describe("#process", function() {
      it("should call the 'connected' handler with a connection", function() {
        var onConnected = jasmine.createSpy("onConnected");
        var onOther = jasmine.createSpy("onOther");

        handshake.process({
          connected: onConnected,
          other: onOther
        });

        expect(onConnected).toHaveBeenCalledWith(jasmine.any(Pusher.Connection));
        expect(onOther).not.toHaveBeenCalled();
        expect(onConnected.calls[0].args[0].id).toEqual("123.456");
      });
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

    it("should call back", function() {
      expect(callback).toHaveBeenCalled();
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

    describe("#process", function() {
      it("should call correct handler with correct error", function() {
        var onConnected = jasmine.createSpy("onConnected");
        var onTest = jasmine.createSpy("onTest");

        handshake.process({
          connected: onConnected,
          test: onTest
        });

        expect(onConnected).not.toHaveBeenCalled();
        expect(onTest).toHaveBeenCalledWith("err");
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

    it("should call back", function() {
      expect(callback).toHaveBeenCalled();
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

    describe("#process", function() {
      it("should call correct handler with an undefined error", function() {
        var onConnected = jasmine.createSpy("onConnected");
        var onBoo = jasmine.createSpy("onBoo");

        handshake.process({
          connected: onConnected,
          boo: onBoo
        });

        expect(onConnected).not.toHaveBeenCalled();
        expect(onBoo).toHaveBeenCalledWith(undefined);
      });
    });
  });
});
