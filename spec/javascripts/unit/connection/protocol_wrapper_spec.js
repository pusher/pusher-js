describe("ProtocolWrapper", function() {
  var transport;
  var wrapper;

  beforeEach(function() {
    transport = Pusher.Mocks.getTransport(true);
    transport.send = jasmine.createSpy("send").andReturn(true);
    transport.close = jasmine.createSpy("close");

    wrapper = new Pusher.ProtocolWrapper(transport);

    transport.emit("message", {
      data: JSON.stringify({
        event: "pusher:connection_established",
        data: {
          socket_id: "123.456"
        }
      })
    });
  });

  describe("#supportsPing", function() {
    it("should return true if transport supports ping", function() {
      transport.supportsPing.andReturn(true);
      expect(wrapper.supportsPing()).toBe(true);
    });

    it("should return false if transport does not support ping", function() {
      transport.supportsPing.andReturn(false);
      expect(wrapper.supportsPing()).toBe(false);
    });
  });

  describe("#connect", function() {
    beforeEach(function() {
      wrapper = new Pusher.ProtocolWrapper(transport);
    });

    it("should emit 'connected' after receiving pusher:connection_established", function() {
      var onConnected = jasmine.createSpy("onConnected");
      wrapper.bind("connected", onConnected);

      expect(onConnected).not.toHaveBeenCalled();

      transport.emit("message", {
        data: JSON.stringify({
          event: "pusher:connection_established",
          data: {
            socket_id: "123.456"
          }
        })
      });

      expect(onConnected).toHaveBeenCalledWith("123.456");
    });

    it("should emit 'ssl_only' when receiving 4000 close code", function() {
      var onConnected = jasmine.createSpy("onConnected");
      var onSSLOnly = jasmine.createSpy("onSSLOnly");
      wrapper.bind("ssl_only", onSSLOnly);
      wrapper.bind("connected", onConnected);

      transport.emit("message", {
        data: JSON.stringify({
          event: "pusher:error",
          data: {
            code: 4000,
            message: "SSL only"
          }
        })
      });

      expect(onConnected).not.toHaveBeenCalled();
      expect(onSSLOnly).toHaveBeenCalled();
      expect(transport.close).toHaveBeenCalled();
    });

    it("should emit 'refused' when receiving 4001-4099 close code", function() {
      var onConnected = jasmine.createSpy("onConnected");
      var onRefused = jasmine.createSpy("onRefused");
      wrapper.bind("refused", onRefused);
      wrapper.bind("connected", onConnected);

      transport.emit("message", {
        data: JSON.stringify({
          event: "pusher:error",
          data: {
            code: 4069,
            message: "refused"
          }
        })
      });

      expect(onConnected).not.toHaveBeenCalled();
      expect(onRefused).toHaveBeenCalled();
      expect(transport.close).toHaveBeenCalled();
    });

    it("should emit 'backoff' when receiving 4100-4199 close code", function() {
      var onConnected = jasmine.createSpy("onConnected");
      var onBackoff = jasmine.createSpy("onBackoff");
      wrapper.bind("backoff", onBackoff);
      wrapper.bind("connected", onConnected);

      transport.emit("message", {
        data: JSON.stringify({
          event: "pusher:error",
          data: {
            code: 4100,
            message: "backoff"
          }
        })
      });

      expect(onConnected).not.toHaveBeenCalled();
      expect(onBackoff).toHaveBeenCalled();
      expect(transport.close).toHaveBeenCalled();
    });

    it("should emit 'retry' when receiving 4200-4299 close code", function() {
      var onConnected = jasmine.createSpy("onConnected");
      var onRetry = jasmine.createSpy("onRetry");
      wrapper.bind("retry", onRetry);
      wrapper.bind("connected", onConnected);

      transport.emit("message", {
        data: JSON.stringify({
          event: "pusher:error",
          data: {
            code: 4299,
            message: "retry"
          }
        })
      });

      expect(onConnected).not.toHaveBeenCalled();
      expect(onRetry).toHaveBeenCalled();
      expect(transport.close).toHaveBeenCalled();
    });

    it("should emit 'refused' when receiving unknown close code", function() {
      var onConnected = jasmine.createSpy("onConnected");
      var onRefused = jasmine.createSpy("onRefused");
      wrapper.bind("refused", onRefused);
      wrapper.bind("connected", onConnected);

      transport.emit("message", {
        data: JSON.stringify({
          event: "pusher:error",
          data: {
            code: 4301,
            message: "unknown error"
          }
        })
      });

      expect(onConnected).not.toHaveBeenCalled();
      expect(onRefused).toHaveBeenCalled();
      expect(transport.close).toHaveBeenCalled();
    });
  });

  describe("#send", function() {
    it("should pass the data to the transport", function() {
      transport.send.andReturn(true);
      wrapper.send("proxy");
      expect(transport.send).toHaveBeenCalledWith("proxy");
    });

    it("should return true if the transport sent the data", function() {
      transport.send.andReturn(true);
      expect(wrapper.send("proxy")).toBe(true);
    });

    it("should return false if the transport did not send the data", function() {
      transport.send.andReturn(false);
      expect(wrapper.send("proxy")).toBe(false);
    });

    it("should send events in correct format", function() {
      expect(wrapper.send_event("test", [1,2,3])).toBe(true);
      expect(transport.send).toHaveBeenCalledWith(JSON.stringify({
        event: "test",
        data: [1,2,3]
      }));
    });

    it("should send events in correct format (including channel)", function() {
      wrapper.send_event("test", [1,2,3], "chan");
      expect(transport.send).toHaveBeenCalledWith(JSON.stringify({
        event: "test",
        data: [1,2,3],
        channel: "chan"
      }));
    });
  });

  describe("after receiving a message", function() {
    it("should emit general messages", function() {
      var onMessage = jasmine.createSpy("onMessage");
      wrapper.bind("message", onMessage);

      transport.emit("message", {
        data: JSON.stringify({
          event: "random",
          data: { foo: "bar" }
        })
      });
      expect(onMessage).toHaveBeenCalledWith({
        event: "random",
        data: { foo: "bar" }
      });
    });

    it("should emit errors", function() {
      var onError = jasmine.createSpy("onError");
      wrapper.bind("error", onError);

      transport.emit("message", {
        data: JSON.stringify({
          event: "pusher:error",
          data: ":("
        })
      });
      expect(onError).toHaveBeenCalledWith({
        type: "PusherError",
        data: ":("
      });
    });

    it("should emit ping", function() {
      var onPing = jasmine.createSpy("onPing");
      wrapper.bind("ping", onPing);

      transport.emit("message", {
        data: JSON.stringify({
          event: "pusher:ping",
          data: {}
        })
      });
      expect(onPing).toHaveBeenCalled();
    });

    it("should emit pong", function() {
      var onPong = jasmine.createSpy("onPong");
      wrapper.bind("pong", onPong);

      transport.emit("message", {
        data: JSON.stringify({
          event: "pusher:pong",
          data: {}
        })
      });
      expect(onPong).toHaveBeenCalled();
    });

    it("should emit an error after receiving invalid JSON", function() {
      var error = {};

      var onMessage = jasmine.createSpy("onMessage");
      var onError = jasmine.createSpy("onError").andCallFake(function(e) {
        error = e;
      });
      wrapper.bind("message", onMessage);
      wrapper.bind("error", onError);

      transport.emit("message", {
        data: "this is not json"
      });
      expect(onMessage).not.toHaveBeenCalled();
      expect(error.type).toEqual("MessageParseError");
      expect(error.data).toEqual("this is not json");
    });
  });

  describe("after receiving a transport error", function() {
    it("should emit the error", function() {
      var onError = jasmine.createSpy("onError");
      wrapper.bind("error", onError);

      transport.emit("error", "wut");
      expect(onError).toHaveBeenCalledWith({
        type: "WebSocketError",
        error: "wut"
      });
    });
  });

  describe("on connection close", function() {
    it("should emit closed", function() {
      var onClosed = jasmine.createSpy("onClosed");
      wrapper.bind("closed", onClosed);

      transport.emit("closed");
      expect(onClosed).toHaveBeenCalled();
    });

    it("should call close on the transport", function() {
      wrapper.close();
      expect(transport.close).toHaveBeenCalled();
    });
  });
});
