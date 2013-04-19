describe("Protocol", function() {
  describe("#decodeMessage", function() {
    it("should parse a single-encoded message with an object", function() {
      var message = {
        data: JSON.stringify({
          event: "random",
          data: { foo: "bar" }
        })
      };

      expect(Pusher.Protocol.decodeMessage(message)).toEqual({
        event: "random",
        data: {
          foo: "bar"
        }
      });
    });

    it("should parse a single-encoded message with a string", function() {
      var message = {
        data: JSON.stringify({
          event: "raw",
          data: "just a string"
        })
      };

      expect(Pusher.Protocol.decodeMessage(message)).toEqual({
        event: "raw",
        data: "just a string"
      });
    });

    it("should parse a double-encoded message", function() {
      var message = {
        data: JSON.stringify({
          event: "double",
          data: JSON.stringify({ x: "y", z: 1 })
        })
      };

      expect(Pusher.Protocol.decodeMessage(message)).toEqual({
        event: "double",
        data: {
          x: "y",
          z: 1
        }
      });
    });

    it("should throw an exception if message is malformed", function() {
      var message = {
        data: "this isn't JSON"
      };

      try {
        Pusher.Protocol.decodeMessage(message);
        throw "Should not reach this line";
      } catch (e) {
        expect(e.type).toEqual("MessageParseError");
        expect(e.error).toEqual(jasmine.any(SyntaxError));
        expect(e.data).toEqual("this isn't JSON");
      }
    });
  });

  describe("#encodeMessage", function() {
    it("should encode a message so that it can be JSON-decoded back", function() {
      var message = {
        event: "test",
        data: { x: 1, y: 0.25, z: "foo" },
        channel: "test_channel"
      };

      var encoded = Pusher.Protocol.encodeMessage(message);
      expect(JSON.parse(encoded)).toEqual(message);
    });
  });

  describe("#processHandshake", function() {
    it("should return 'connected' with an id after getting pusher:connection_established", function() {
      var message = {
        data: JSON.stringify({
          event: "pusher:connection_established",
          data: {
            socket_id: "123.456"
          }
        })
      };

      expect(Pusher.Protocol.processHandshake(message)).toEqual({
        action: "connected",
        id: "123.456"
      });
    });

    function getErrorMessage(code, reason) {
      return {
        data: JSON.stringify({
          event: "pusher:error",
          data: {
            code: code,
            message: reason
          }
        })
      };
    }

    it("should return 'ssl_only' for code 4000", function() {
      var message = getErrorMessage(4000, "SSL ONLY!");
      expect(Pusher.Protocol.processHandshake(message)).toEqual({
        action: "ssl_only",
        error: {
          type: "PusherError",
          data: {
            code: 4000,
            message: "SSL ONLY!"
          }
        }
      });
    });

    it("should return 'refused' for codes 4001-4099", function() {
      for (var code = 4001; code <= 4099; code++) {
        var message = getErrorMessage(code, "refused-" + code);
        expect(Pusher.Protocol.processHandshake(message)).toEqual({
          action: "refused",
          error: {
            type: "PusherError",
            data: {
              code: code,
              message: "refused-" + code
            }
          }
        });
      }
    });

    it("should return 'backoff' for codes 4100-4199", function() {
      for (var code = 4100; code <= 4199; code++) {
        var message = getErrorMessage(code, "backoff-" + code);
        expect(Pusher.Protocol.processHandshake(message)).toEqual({
          action: "backoff",
          error: {
            type: "PusherError",
            data: {
              code: code,
              message: "backoff-" + code
            }
          }
        });
      }
    });

    it("should return 'retry' for codes 4200-4299", function() {
      for (var code = 4200; code <= 4299; code++) {
        var message = getErrorMessage(code, "retry-" + code);
        expect(Pusher.Protocol.processHandshake(message)).toEqual({
          action: "retry",
          error: {
            type: "PusherError",
            data: {
              code: code,
              message: "retry-" + code
            }
          }
        });
      }
    });

    it("should return 'refused' for codes 4300-4999", function() {
      for (var code = 4300; code <= 4999; code++) {
        var message = getErrorMessage(code, "refused-" + code);
        expect(Pusher.Protocol.processHandshake(message)).toEqual({
          action: "refused",
          error: {
            type: "PusherError",
            data: {
              code: code,
              message: "refused-" + code
            }
          }
        });
      }
    });

    it("should throw an exception on invalid handshake", function() {
      expect(function() {
        return Pusher.Protocol.processHandshake({
          data: JSON.stringify({
            event: "weird"
          })
        });
      }).toThrow("Invalid handshake");
    });
  });

  describe("#getCloseAction", function() {
    it("should return null for codes 1000,1001", function() {
      for (var code = 1000; code <= 1001; code++) {
        expect(Pusher.Protocol.getCloseAction({ code: code }))
          .toBe(null);
      }
    });

    it("should return 'backoff' for codes 1002-1004", function() {
      for (var code = 1002; code <= 1004; code++) {
        expect(Pusher.Protocol.getCloseAction({ code: code }))
          .toEqual("backoff");
      }
    });

    it("should return null for codes 1005-3999", function() {
      for (var code = 1005; code <= 3999; code++) {
        expect(Pusher.Protocol.getCloseAction({ code: code }))
          .toBe(null);
      }
    });

    it("should return 'ssl_only' for code 4000", function() {
      expect(Pusher.Protocol.getCloseAction({ code: 4000 }))
        .toEqual("ssl_only");
    });

    it("should return 'refused' for codes 4001-4099", function() {
      for (var code = 4001; code <= 4099; code++) {
        expect(Pusher.Protocol.getCloseAction({ code: code }))
          .toEqual("refused");
      }
    });

    it("should return 'backoff' for codes 4100-4199", function() {
      for (var code = 4100; code <= 4199; code++) {
        expect(Pusher.Protocol.getCloseAction({ code: code }))
          .toEqual("backoff");
      }
    });

    it("should return 'retry' for codes 4200-4299", function() {
      for (var code = 4200; code <= 4299; code++) {
        expect(Pusher.Protocol.getCloseAction({ code: code }))
          .toEqual("retry");
      }
    });

    it("should return 'refused' for codes 4300-4999", function() {
      for (var code = 4300; code <= 4999; code++) {
        expect(Pusher.Protocol.getCloseAction({ code: code }))
          .toEqual("refused");
      }
    });
  });

  describe("#getCloseError", function() {
    it("should return null for codes 1000,1001", function() {
      for (var code = 1000; code <= 1001; code++) {
        expect(Pusher.Protocol.getCloseError({ code: code, reason: "no" }))
          .toBe(null);
      }
    });

    it("should return an error using 'reason' field for codes 1002-4999", function() {
      for (var code = 1002; code <= 4999; code++) {
        expect(Pusher.Protocol.getCloseError({
          code: code,
          reason: "c" + code
        })).toEqual({
          type: "PusherError",
          data: {
            code: code,
            message: "c" + code
          }
        });
      }
    });

    it("should return an error using 'message' field for codes 1002-4999", function() {
      for (var code = 1002; code <= 4999; code++) {
        expect(Pusher.Protocol.getCloseError({
          code: code,
          message: "c" + code
        })).toEqual({
          type: "PusherError",
          data: {
            code: code,
            message: "c" + code
          }
        });
      }
    });
  });
});
