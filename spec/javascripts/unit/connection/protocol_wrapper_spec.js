describe("ProtocolWrapper", function() {
  beforeEach(function() {
    this.transport = new Pusher.EventsDispatcher();
    this.transport.send = jasmine.createSpy("send").andReturn(true);
    this.transport.close = jasmine.createSpy("close");

    this.wrapper = new Pusher.ProtocolWrapper(this.transport);

    this.transport.emit("message", {
      data: JSON.stringify({
        event: "pusher:connection_established",
        data: {
          socket_id: "123.456"
        }
      })
    });
  });

  it("should proxy supportsPing calls", function() {
    this.transport.supportsPing = jasmine.createSpy().andReturn(true);
    expect(this.wrapper.supportsPing()).toBe(true);
    expect(this.transport.supportsPing).toHaveBeenCalled();

    this.transport.supportsPing = jasmine.createSpy().andReturn(false);
    expect(this.wrapper.supportsPing()).toBe(false);
    expect(this.transport.supportsPing).toHaveBeenCalled();
  });

  describe("on connection attempt", function() {
    beforeEach(function() {
      this.wrapper = new Pusher.ProtocolWrapper(this.transport);
    });

    it("should wait for pusher:connection_established", function() {
      var onConnected = jasmine.createSpy("onConnected");
      this.wrapper.bind("connected", onConnected);

      expect(onConnected).not.toHaveBeenCalled();

      this.transport.emit("message", {
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
      this.wrapper.bind("ssl_only", onSSLOnly);
      this.wrapper.bind("connected", onConnected);

      this.transport.emit("message", {
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
      expect(this.transport.close).toHaveBeenCalled();
    });

    it("should emit 'refused' when receiving 4001-4099 close code", function() {
      var onConnected = jasmine.createSpy("onConnected");
      var onRefused = jasmine.createSpy("onRefused");
      this.wrapper.bind("refused", onRefused);
      this.wrapper.bind("connected", onConnected);

      this.transport.emit("message", {
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
      expect(this.transport.close).toHaveBeenCalled();
    });

    it("should emit 'backoff' when receiving 4100-4199 close code", function() {
      var onConnected = jasmine.createSpy("onConnected");
      var onBackoff = jasmine.createSpy("onBackoff");
      this.wrapper.bind("backoff", onBackoff);
      this.wrapper.bind("connected", onConnected);

      this.transport.emit("message", {
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
      expect(this.transport.close).toHaveBeenCalled();
    });

    it("should emit 'retry' when receiving 4200-4299 close code", function() {
      var onConnected = jasmine.createSpy("onConnected");
      var onRetry = jasmine.createSpy("onRetry");
      this.wrapper.bind("retry", onRetry);
      this.wrapper.bind("connected", onConnected);

      this.transport.emit("message", {
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
      expect(this.transport.close).toHaveBeenCalled();
    });
  });

  describe("when sending messages", function() {
    it("should proxy send calls", function() {
      this.transport.send = jasmine.createSpy().andReturn(true);
      expect(this.wrapper.send("proxy")).toBe(true);
      expect(this.transport.send).toHaveBeenCalledWith("proxy");

      this.transport.send = jasmine.createSpy().andReturn(false);
      expect(this.wrapper.send("falsch")).toBe(false);
      expect(this.transport.send).toHaveBeenCalledWith("falsch");
    });

    it("should send events in correct format", function() {
      expect(this.wrapper.send_event("test", [1,2,3])).toBe(true);
      expect(this.transport.send).toHaveBeenCalledWith(JSON.stringify({
        event: "test",
        data: [1,2,3]
      }));
    });

    it("should send events in correct format (including channel)", function() {
      this.wrapper.send_event("test", [1,2,3], "chan");
      expect(this.transport.send).toHaveBeenCalledWith(JSON.stringify({
        event: "test",
        data: [1,2,3],
        channel: "chan"
      }));
    });
  });

  describe("when receiving messages", function() {
    it("should emit general messages", function() {
      var onMessage = jasmine.createSpy("onMessage");
      this.wrapper.bind("message", onMessage);

      this.transport.emit("message", {
        data: JSON.stringify({
          event: "random",
          data: { foo: "bar" }
        })
      })
      expect(onMessage).toHaveBeenCalledWith({
        event: "random",
        data: { foo: "bar" }
      });
    });

    it("should emit errors", function() {
      var onError = jasmine.createSpy("onError");
      this.wrapper.bind("error", onError);

      this.transport.emit("message", {
        data: JSON.stringify({
          event: "pusher:error",
          data: ":("
        })
      })
      expect(onError).toHaveBeenCalledWith({
        type: "PusherError",
        data: ":("
      });
    });

    it("should emit ping", function() {
      var onPing = jasmine.createSpy("onPing");
      this.wrapper.bind("ping", onPing);

      this.transport.emit("message", {
        data: JSON.stringify({
          event: "pusher:ping",
          data: {}
        })
      })
      expect(onPing).toHaveBeenCalled();
    });

    it("should emit pong", function() {
      var onPong = jasmine.createSpy("onPong");
      this.wrapper.bind("pong", onPong);

      this.transport.emit("message", {
        data: JSON.stringify({
          event: "pusher:pong",
          data: {}
        })
      })
      expect(onPong).toHaveBeenCalled();
    });

    it("should emit an error after receiving invalid JSON", function() {
      var onMessage = jasmine.createSpy("onMessage");
      var onError = jasmine.createSpy("onError");
      this.wrapper.bind("message", onMessage);
      this.wrapper.bind("error", onError);

      this.transport.emit("message", {
        data: "this is not json"
      })
      expect(onMessage).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith({
        type: "MessageParseError",
        error: {},
        data: "this is not json"
      });
    });
  });

  describe("on transport error", function() {
    it("should emit the error", function() {
      var onError = jasmine.createSpy("onError");
      this.wrapper.bind("error", onError);

      this.transport.emit("error", "wut");
      expect(onError).toHaveBeenCalledWith({
        type: "WebSocketError",
        error: "wut"
      });
    });
  });

  describe("on connection close", function() {
    it("should emit closed", function() {
      var onClosed = jasmine.createSpy("onClosed");
      this.wrapper.bind("closed", onClosed);

      this.transport.emit("closed");
      expect(onClosed).toHaveBeenCalled();
    });

    it("should call close on the transport", function() {
      this.wrapper.close();
      expect(this.transport.close).toHaveBeenCalled();
    });
  });
});
