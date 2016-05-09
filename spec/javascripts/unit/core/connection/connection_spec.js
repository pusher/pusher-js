var Connection = require('core/connection/connection').default;
var Protocol = require('core/connection/protocol/protocol');
var Mocks = require("mocks");

describe("Connection", function() {
  var transport;
  var connection;

  beforeEach(function() {
    transport = Mocks.getTransport();
    connection = new Connection("111.22", transport);
  });

  describe("#activityTimeout", function() {
    it("should be set to undefined if the transport doesn't have a activityTimeout value", function() {
      var transport = Mocks.getTransport();
      var connection = new Connection("111.22", transport);
      expect(connection.activityTimeout).toBe(undefined);
    });

    it("should be set to the transport's activityTimeout value", function() {
      var transport = Mocks.getTransport();
      transport.activityTimeout = 123123;
      var connection = new Connection("111.22", transport);
      expect(connection.activityTimeout).toEqual(123123);
    });
  });

  describe("#handlesActivityChecks", function() {
    it("should return true if transport handles activity checks by itself", function() {
      transport.handlesActivityChecks.andReturn(true);
      expect(connection.handlesActivityChecks()).toBe(true);
    });

    it("should return false if transport does not handle activity checks by itself", function() {
      transport.handlesActivityChecks.andReturn(false);
      expect(connection.handlesActivityChecks()).toBe(false);
    });
  });

  describe("#send", function() {
    it("should pass the data to the transport", function() {
      transport.send.andReturn(true);
      connection.send("proxy");
      expect(transport.send).toHaveBeenCalledWith("proxy");
    });

    it("should return true if the transport sent the data", function() {
      transport.send.andReturn(true);
      expect(connection.send("proxy")).toBe(true);
    });

    it("should return false if the transport did not send the data", function() {
      transport.send.andReturn(false);
      expect(connection.send("proxy")).toBe(false);
    });

    it("should send events in correct format", function() {
      expect(connection.send_event("test", [1,2,3])).toBe(true);
      expect(transport.send).toHaveBeenCalledWith(JSON.stringify({
        event: "test",
        data: [1,2,3]
      }));
    });

    it("should send events in correct format (including channel)", function() {
      connection.send_event("test", [1,2,3], "chan");
      expect(transport.send).toHaveBeenCalledWith(JSON.stringify({
        event: "test",
        data: [1,2,3],
        channel: "chan"
      }));
    });
  });

  describe("#ping", function() {
    it("should call ping on the transport if it's supported", function() {
      transport.supportsPing.andReturn(true);
      connection.ping();
      expect(transport.ping).toHaveBeenCalled();
      expect(transport.send).not.toHaveBeenCalled();
    });

    it("should send a pusher:ping event if ping is not supported", function() {
      transport.supportsPing.andReturn(false);
      connection.ping();

      expect(transport.ping).not.toHaveBeenCalled();
      var pingEvent = JSON.parse(transport.send.calls[0].args[0]);
      expect(pingEvent).toEqual({
        event: "pusher:ping",
        data: {}
      });
    });
  });

  describe("#close", function() {
    it("should call close on the transport", function() {
      connection.close();
      expect(transport.close).toHaveBeenCalled();
    });
  });

  describe("after receiving a message", function() {
    it("should emit generic messages", function() {
      var onMessage = jasmine.createSpy("onMessage");
      connection.bind("message", onMessage);

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
      connection.bind("error", onError);

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

    it("should emit 'ping'", function() {
      var onPing = jasmine.createSpy("onPing");
      connection.bind("ping", onPing);

      transport.emit("message", {
        data: JSON.stringify({
          event: "pusher:ping",
          data: {}
        })
      });
      expect(onPing).toHaveBeenCalled();
    });

    it("should emit 'pong'", function() {
      var onPong = jasmine.createSpy("onPong");
      connection.bind("pong", onPong);

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
      connection.bind("message", onMessage);
      connection.bind("error", onError);

      transport.emit("message", {
        data: "this is not json"
      });
      expect(onMessage).not.toHaveBeenCalled();
      expect(error.type).toEqual("MessageParseError");
      expect(error.data).toEqual("this is not json");
    });
  });

  describe("after receiving an activity event", function() {
    it("should emit an activity event too", function() {
      var onActivity = jasmine.createSpy("onActivity");
      connection.bind("activity", onActivity);

      expect(onActivity).not.toHaveBeenCalled();
      transport.emit("activity");
      expect(onActivity).toHaveBeenCalled();
    });
  });

  describe("after transport has closed", function() {
    it("should emit 'closed'", function() {
      var onClosed = jasmine.createSpy("onClosed");
      connection.bind("closed", onClosed);

      transport.emit("closed", { code: 1006, reason: "unknown" });

      expect(onClosed).toHaveBeenCalled();
    });

    it("should 'closed' even if close codes are not supported", function() {
      var onClosed = jasmine.createSpy("onClosed");
      connection.bind("closed", onClosed);

      transport.emit("closed", {});

      expect(onClosed).toHaveBeenCalled();
    });

    it("should emit the action dispatched by protocol", function() {
      var onMockAction = jasmine.createSpy("onMockAction");
      connection.bind("mock_action", onMockAction);
      spyOn(Protocol, "getCloseAction").andReturn("mock_action");
      spyOn(Protocol, "getCloseError").andReturn(null);

      transport.emit("closed", { code: 1006, reason: "unknown" });

      expect(Protocol.getCloseAction).toHaveBeenCalledWith({
        code: 1006,
        reason: "unknown"
      });
      expect(onMockAction).toHaveBeenCalled();
    });

    it("should emit the error returned by protocol", function() {
      var onError = jasmine.createSpy("onError");
      connection.bind("error", onError);
      spyOn(Protocol, "getCloseAction").andReturn("mock_action");
      spyOn(Protocol, "getCloseError").andReturn({
        type: "MockError",
        data: {
          code: 4123,
          message: "something"
        }
      });

      transport.emit("closed", { code: 4123, reason: "something" });

      expect(Protocol.getCloseError).toHaveBeenCalledWith({
        code: 4123,
        reason: "something"
      });
      expect(onError).toHaveBeenCalledWith({
        type: "MockError",
        data: {
          code: 4123,
          message: "something"
        }
      });
    });

    it("should not emit 'error' if close codes are not supported", function() {
      var onError = jasmine.createSpy("onError");
      connection.bind("error", onError);

      transport.emit("closed", {});

      expect(onError).not.toHaveBeenCalled();
    });

    it("should not close the transport", function() {
      transport.emit("closed", { code: 4001, reason: "reason" });

      expect(transport.close).not.toHaveBeenCalled();
    });
  });

  describe("after receiving a transport error", function() {
    it("should emit the error", function() {
      var onError = jasmine.createSpy("onError");
      connection.bind("error", onError);

      transport.emit("error", "wut");
      expect(onError).toHaveBeenCalledWith({
        type: "WebSocketError",
        error: "wut"
      });
    });
  });
});
