var Protocol = require('core/connection/protocol/protocol');

describe("Protocol", function() {
  describe("#decodeMessage", function() {
    it("should parse a single-encoded message with an object", function() {
      var message = {
        data: JSON.stringify({
          event: "random",
          data: { foo: "bar" }
        })
      };

      expect(Protocol.decodeMessage(message)).toEqual({
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

      expect(Protocol.decodeMessage(message)).toEqual({
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

      expect(Protocol.decodeMessage(message)).toEqual({
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
        Protocol.decodeMessage(message);
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

      var encoded = Protocol.encodeMessage(message);
      expect(JSON.parse(encoded)).toEqual(message);
    });
  });

  describe("#processHandshake", function() {
    it("should return 'connected' with an id after getting pusher:connection_established", function() {
      var message = {
        data: JSON.stringify({
          event: "pusher:connection_established",
          data: {
            socket_id: "123.456",
            activity_timeout: 30
          }
        })
      };

      expect(Protocol.processHandshake(message)).toEqual({
        action: "connected",
        id: "123.456",
        activityTimeout: 30000
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

    it("should return 'tls_only' for code 4000", function() {
      var message = getErrorMessage(4000, "SSL ONLY!");
      expect(Protocol.processHandshake(message)).toEqual({
        action: "tls_only",
        error: {
          type: "PusherError",
          data: {
            code: 4000,
            message: "SSL ONLY!"
          }
        }
      });
    });

    it("should return 'refused' for code 4001", function() {
      var message = getErrorMessage(4001, "REFUSED 4001");
      expect(Protocol.processHandshake(message)).toEqual({
        action: "refused",
        error: {
          type: "PusherError",
          data: {
            code: 4001,
            message: "REFUSED 4001"
          }
        }
      });
    });

    it("should return 'refused' for code 4099", function() {
      var message = getErrorMessage(4099, "REFUSED 4099");
      expect(Protocol.processHandshake(message)).toEqual({
        action: "refused",
        error: {
          type: "PusherError",
          data: {
            code: 4099,
            message: "REFUSED 4099"
          }
        }
      });
    });

    it("should return 'backoff' for code 4100", function() {
      var message = getErrorMessage(4100, "BACKOFF 4100");
      expect(Protocol.processHandshake(message)).toEqual({
        action: "backoff",
        error: {
          type: "PusherError",
          data: {
            code: 4100,
            message: "BACKOFF 4100"
          }
        }
      });
    });

    it("should return 'backoff' for code 4199", function() {
      var message = getErrorMessage(4199, "BACKOFF 4199");
      expect(Protocol.processHandshake(message)).toEqual({
        action: "backoff",
        error: {
          type: "PusherError",
          data: {
            code: 4199,
            message: "BACKOFF 4199"
          }
        }
      });
    });

    it("should return 'retry' for code 4200", function() {
      var message = getErrorMessage(4200, "RETRY 4200");
      expect(Protocol.processHandshake(message)).toEqual({
        action: "retry",
        error: {
          type: "PusherError",
          data: {
            code: 4200,
            message: "RETRY 4200"
          }
        }
      });
    });

    it("should return 'retry' for code 4299", function() {
      var message = getErrorMessage(4299, "RETRY 4299");
      expect(Protocol.processHandshake(message)).toEqual({
        action: "retry",
        error: {
          type: "PusherError",
          data: {
            code: 4299,
            message: "RETRY 4299"
          }
        }
      });
    });

    it("should return 'refused' for code 4300", function() {
      var message = getErrorMessage(4300, "REFUSED 4300");
      expect(Protocol.processHandshake(message)).toEqual({
        action: "refused",
        error: {
          type: "PusherError",
          data: {
            code: 4300,
            message: "REFUSED 4300"
          }
        }
      });
    });

    it("should return 'refused' for code 4399", function() {
      var message = getErrorMessage(4399, "REFUSED 4399");
      expect(Protocol.processHandshake(message)).toEqual({
        action: "refused",
        error: {
          type: "PusherError",
          data: {
            code: 4399,
            message: "REFUSED 4399"
          }
        }
      });
    });

    it("should throw an exception when activity timeout is unspecified", function() {
      expect(function() {
        return Protocol.processHandshake({
          data: JSON.stringify({
            event: "pusher:connection_established",
            data: {
              socket_id: "123.456"
            }
          })
        });
      }).toThrow("No activity timeout specified in handshake");
    });

    it("should throw an exception on invalid handshake", function() {
      expect(function() {
        return Protocol.processHandshake({
          data: JSON.stringify({
            event: "weird"
          })
        });
      }).toThrow("Invalid handshake");
    });
  });

  describe("#getCloseAction", function() {
    it("should return null for code 1000", function() {
      expect(Protocol.getCloseAction({ code: 1000 })).toBe(null);
    });

    it("should return null for code 1001", function() {
      expect(Protocol.getCloseAction({ code: 1001 })).toBe(null);
    });

    it("should return 'backoff' for code 1002", function() {
      expect(Protocol.getCloseAction({ code: 1002 })).toBe("backoff");
    });

    it("should return 'backoff' for code 1003", function() {
      expect(Protocol.getCloseAction({ code: 1003 })).toBe("backoff");
    });

    it("should return 'backoff' for code 1004", function() {
      expect(Protocol.getCloseAction({ code: 1004 })).toBe("backoff");
    });

    it("should return null for code 1005", function() {
      expect(Protocol.getCloseAction({ code: 1005 })).toBe(null);
    });

    it("should return null for code 3999", function() {
      expect(Protocol.getCloseAction({ code: 3999 })).toBe(null);
    });

    it("should return 'tls_only' for code 4000", function() {
      expect(Protocol.getCloseAction({ code: 4000 })).toEqual("tls_only");
    });

    it("should return 'refused' for code 4001", function() {
      expect(Protocol.getCloseAction({ code: 4001 })).toBe("refused");
    });

    it("should return 'refused' for code 4099", function() {
      expect(Protocol.getCloseAction({ code: 4099 })).toBe("refused");
    });

    it("should return 'backoff' for code 4100", function() {
      expect(Protocol.getCloseAction({ code: 4100 })).toBe("backoff");
    });

    it("should return 'backoff' for code 4199", function() {
      expect(Protocol.getCloseAction({ code: 4199 })).toBe("backoff");
    });

    it("should return 'retry' for code 4200", function() {
      expect(Protocol.getCloseAction({ code: 4200 })).toBe("retry");
    });

    it("should return 'retry' for code 4299", function() {
      expect(Protocol.getCloseAction({ code: 4299 })).toBe("retry");
    });

    it("should return 'retry' for code 4200", function() {
      expect(Protocol.getCloseAction({ code: 4200 })).toBe("retry");
    });

    it("should return 'retry' for code 4299", function() {
      expect(Protocol.getCloseAction({ code: 4299 })).toBe("retry");
    });

    it("should return 'refused' for code 4300", function() {
      expect(Protocol.getCloseAction({ code: 4300 })).toBe("refused");
    });

    it("should return 'refused' for code 4399", function() {
      expect(Protocol.getCloseAction({ code: 4399 })).toBe("refused");
    });
  });

  describe("#getCloseError", function() {
    it("should return null for code 1000", function() {
      expect(Protocol.getCloseError({ code: 1000, reason: "no" }))
          .toBe(null);
    });

    it("should return null for code 1001", function() {
      expect(Protocol.getCloseError({ code: 1001, reason: "no" }))
          .toBe(null);
    });

    it("should return an error using 'reason' field for code 1002", function() {
      expect(Protocol.getCloseError({
        code: 1002,
        reason: "foo"
      })).toEqual({
        type: "PusherError",
        data: {
          code: 1002,
          message: "foo"
        }
      });
    });

    it("should return an error using 'reason' field for code 4999", function() {
      expect(Protocol.getCloseError({
        code: 4999,
        reason: "bar"
      })).toEqual({
        type: "PusherError",
        data: {
          code: 4999,
          message: "bar"
        }
      });
    });

    it("should return an error using 'message' field for code 1002", function() {
      expect(Protocol.getCloseError({
        code: 1002,
        message: "foo"
      })).toEqual({
        type: "PusherError",
        data: {
          code: 1002,
          message: "foo"
        }
      });
    });


    it("should return an error using 'message' field for code 4999", function() {
      expect(Protocol.getCloseError({
        code: 4999,
        message: "bar"
      })).toEqual({
        type: "PusherError",
        data: {
          code: 4999,
          message: "bar"
        }
      });
    });
  });
});
