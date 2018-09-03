var ConnectionManager = require('core/connection/connection_manager').default;
var Collections = require('core/utils/collections');
var Network = require('net_info').Network;
var Mocks = require("mocks");

describe("ConnectionManager", function() {
  var connection, strategy, timeline;
  var managerOptions, manager;

  beforeEach(function() {
    jasmine.Clock.useMock();

    connection = Mocks.getConnection();
    strategy = Mocks.getStrategy(true);
    timeline = Mocks.getTimeline();

    spyOn(Network, "isOnline").andReturn(true);

    managerOptions = {
      getStrategy: jasmine.createSpy("getStrategy").andReturn(strategy),
      timeline: timeline,
      activityTimeout: 3456,
      pongTimeout: 2345,
      unavailableTimeout: 1234
    };
    manager = new ConnectionManager("foo", managerOptions);
  });

  describe("on construction", function() {
    it("should construct a strategy", function() {
      expect(manager.options.getStrategy.calls.length).toEqual(1);
    });

    it("should pass the key to the strategy builder", function() {
      expect(manager.options.getStrategy.calls[0].args[0].key).toEqual("foo");
    });

    it("should pass a timeline to the strategy builder", function() {
      var getStrategy = jasmine.createSpy("getStrategy").andCallFake(function(options) {
        expect(options.timeline).toBe(timeline);
        return strategy;
      });

      var manager = new ConnectionManager("foo", {
        getStrategy: getStrategy,
        timeline: timeline,
        activityTimeout: 3456,
        pongTimeout: 2345,
        unavailableTimeout: 1234
      });
      expect(getStrategy).toHaveBeenCalled();
    });

    it("should transition to initialized state", function() {
      expect(manager.state).toEqual("initialized");
    });
  });

  describe("#isUsingTLS", function() {
    it("should return false if the manager has been created with useTLS=false", function() {
      expect(manager.isUsingTLS()).toEqual(false);
    });

    it("should return true if the manager has been created with useTLS=true", function() {
      var manager = new ConnectionManager(
        "foo", Collections.extend(managerOptions, { useTLS: true })
      );
      expect(manager.isUsingTLS()).toEqual(true);
    });
  });

  describe("#connect", function() {
    it("should not re-build the strategy", function() {
      manager.connect();
      expect(managerOptions.getStrategy.calls.length).toEqual(1);
    });

    it("should try to connect using the strategy", function() {
      manager.connect();
      expect(strategy.connect).toHaveBeenCalled();
    });

    it("should transition to connecting", function() {
      var onConnecting = jasmine.createSpy("onConnecting");
      var onStateChange = jasmine.createSpy("onStateChange");
      manager.bind("connecting", onConnecting);
      manager.bind("state_change", onStateChange);

      manager.connect();

      expect(manager.state).toEqual("connecting");
      expect(onConnecting).toHaveBeenCalled();
      expect(onStateChange).toHaveBeenCalledWith({
        previous: "initialized",
        current: "connecting"
      });
    });
  });

  describe("before establishing a connection", function() {
    beforeEach(function() {
      manager.connect();
    });

    describe("#send", function() {
      it("should not send data", function() {
        expect(manager.send("FALSE!")).toBe(false);
      });
    });

    describe("#disconnect", function() {
      it("should transition to disconnected", function() {
        var onDisconnected = jasmine.createSpy("onDisconnected");
        manager.bind("disconnected", onDisconnected);

        manager.disconnect();

        expect(onDisconnected).toHaveBeenCalled();
      });

      it("should abort an unfinished connection attempt", function() {
        manager.connect();
        manager.disconnect();

        expect(strategy._abort).toHaveBeenCalled();
      });

      it("should clear the unavailable timer", function() {
        manager.disconnect();

        jasmine.Clock.tick(10000);
        // if unavailable timer had worked, it would have transitioned into 'unavailable'
        expect(manager.state).toEqual("disconnected");
      });
    });

    describe("on unavailable timeout", function() {
      it("should fire the timer and transition to unavailable", function() {
        var onUnavailable = jasmine.createSpy("onUnavailable");
        manager.bind("unavailable", onUnavailable);

        jasmine.Clock.tick(1233);
        expect(manager.state).toEqual("connecting");
        jasmine.Clock.tick(1);
        expect(manager.state).toEqual("unavailable");
        expect(onUnavailable).toHaveBeenCalled();
      });
    });
  });

  describe("on handshake", function() {
    var handshake;

    beforeEach(function() {
      manager.connect();
    });

    describe("with 'tls_only' action", function() {
      var tlsStrategy;

      beforeEach(function() {
        tlsStrategy = Mocks.getStrategy(true);
        managerOptions.getStrategy.andReturn(tlsStrategy);

        handshake = { action: "tls_only" };
        strategy._callback(null, handshake);
      });

      it("should build a TLS strategy", function() {
        expect(managerOptions.getStrategy.calls.length).toEqual(2);
        expect(managerOptions.getStrategy).toHaveBeenCalledWith({
          key: "foo",
          useTLS: true,
          timeline: timeline
        });
      });

      it("should connect using the TLS strategy", function() {
        // connection is retried with a zero delay
        jasmine.Clock.tick(0);
        expect(tlsStrategy.connect).toHaveBeenCalled();
        expect(manager.state).toEqual("connecting");
      });

      it("should transition to 'connecting'", function() {
        expect(manager.state).toEqual("connecting");
      });

      it("#isUsingTLS should return true", function() {
        expect(manager.isUsingTLS()).toEqual(true);
      });
    });

    describe("with 'refused' action", function() {
      var handshake;

      beforeEach(function() {
        handshake = { action: "refused" };
        strategy._callback(null, handshake);
      });

      it("should transition to 'disconnected'", function() {
        expect(manager.state).toEqual("disconnected");
      });

      it("should not reconnect", function() {
        jasmine.Clock.tick(100000);
        expect(manager.state).toEqual("disconnected");
      });
    });

    describe("with 'retry' action", function() {
      var handshake;

      beforeEach(function() {
        handshake = { action: "retry" };
        strategy._callback(null, handshake);
      });

      it("should reconnect immediately", function() {
        jasmine.Clock.tick(0);
        expect(manager.state).toEqual("connecting");
      });
    });

    describe("with 'backoff' action", function() {
      var handshake;
      var onConnectingIn;

      beforeEach(function() {
        handshake = { action: "backoff" };
        onConnectingIn = jasmine.createSpy("onConnectingIn");

        manager.bind("connecting_in", onConnectingIn);
        strategy._callback(null, handshake);
      });

      it("should reconnect after 1s", function() {
        jasmine.Clock.tick(999);
        expect(strategy.connect.calls.length).toEqual(1);
        jasmine.Clock.tick(1);
        expect(strategy.connect.calls.length).toEqual(2);
      });

      it("should emit 'connecting_in' event", function() {
        expect(onConnectingIn.calls.length).toEqual(1);
        expect(onConnectingIn).toHaveBeenCalledWith(1);
      });
    });

    describe("with 'error' action", function() {
      var handshake;
      var onConnectingIn;

      beforeEach(function() {
        handshake = { action: "error", error: "boom" };
        strategy._callback(null, handshake);
      });

      it("should log the error to the timeline", function() {
        expect(timeline.error).toHaveBeenCalledWith({ handshakeError: "boom" });
      });

      it("should not abort the strategy", function() {
        expect(strategy._abort).not.toHaveBeenCalled();
      });
    });
  });

  describe("after establishing a connection", function() {
    var handshake;
    var onConnected;

    beforeEach(function() {
      onConnected = jasmine.createSpy("onConnected");
      manager.bind("connected", onConnected);

      manager.connect();

      connection.id = "123.456";
      handshake = {
        action: "connected",
        connection: connection,
        activityTimeout: 500
      };
      strategy._callback(null, handshake);
    });

    it("should transition to connected", function() {
      expect(onConnected).toHaveBeenCalled();
    });

    it("should assign 'socket_id' to the manager", function() {
      expect(manager.socket_id).toEqual("123.456");
    });

    it("should abort substrategy immediately", function() {
      expect(strategy._abort).toHaveBeenCalled();
    });

    it("should clear the unavailable timer", function() {
      jasmine.Clock.tick(1500);
      // if unavailable timer was not cleared, state should be unavailable
      expect(manager.state).toEqual("connected");
    });

    it("should not try to connect again", function() {
      expect(strategy.connect.calls.length).toEqual(1);
      manager.connect();
      expect(strategy.connect.calls.length).toEqual(1);
    });

    describe("#send", function() {
      it("should pass data to the connection", function() {
        expect(manager.send("howdy")).toBe(true);
        expect(connection.send).toHaveBeenCalledWith("howdy");
      });
    });

    describe("#disconnect", function() {
      it("should transition to disconnected", function() {
        var onDisconnected = jasmine.createSpy("onDisconnected");
        manager.bind("disconnected", onDisconnected);

        manager.disconnect();

        expect(onDisconnected).toHaveBeenCalled();
      });

      it("should close the connection", function() {
        manager.disconnect();

        expect(connection.close).toHaveBeenCalled();
      });

      it("should clear the activity check", function() {
        manager.disconnect();

        jasmine.Clock.tick(10000);
        // if activity check had worked, it would have sent a ping message
        expect(connection.ping).not.toHaveBeenCalled();
      });

      it("should stop emitting received messages", function() {
        var onMessage = jasmine.createSpy("onMessage");
        manager.bind("message", onMessage);

        manager.disconnect();

        connection.emit("message", {});
        expect(onMessage).not.toHaveBeenCalled();
      });
    });

    describe("and losing the connection", function() {
      var onConnecting, onDisconnected;

      beforeEach(function() {
        onConnecting = jasmine.createSpy("onConnecting");
        onDisconnected = jasmine.createSpy("onDisconnected");
        manager.bind("connecting", onConnecting);
        manager.bind("disconnected", onDisconnected);

        connection.emit("closed");
      });

      it("should transition to 'connecting' after 1s", function() {
        jasmine.Clock.tick(999);
        expect(onConnecting).not.toHaveBeenCalled();

        jasmine.Clock.tick(1);
        expect(onConnecting).toHaveBeenCalled();
        expect(manager.state).toEqual("connecting");
      });

      it("should clean up the activity check", function() {
        jasmine.Clock.tick(10000);
        // if activity check had worked, it would have sent a ping message
        expect(connection.ping).not.toHaveBeenCalled();
      });
    });

    describe("while reconnecting", function() {
      it("should re-use the strategy", function() {
        expect(managerOptions.getStrategy.calls.length).toEqual(1);
        expect(strategy.connect.calls.length).toEqual(1);

        manager.disconnect();
        manager.connect();

        expect(managerOptions.getStrategy.calls.length).toEqual(1);
        expect(strategy.connect.calls.length).toEqual(2);
      });
    });

    describe("on activity timeout", function() {
      it("should send a ping", function() {
        jasmine.Clock.tick(499);
        expect(connection.ping).not.toHaveBeenCalled();

        jasmine.Clock.tick(1);
        expect(connection.ping).toHaveBeenCalled();

        jasmine.Clock.tick(999);
        expect(connection.close).not.toHaveBeenCalled();

        connection.emit("activity");
        // pong received, connection should not get closed
        jasmine.Clock.tick(1000);
        expect(connection.close).not.toHaveBeenCalled();
      });

      it("should close the connection after pong timeout", function() {
        jasmine.Clock.tick(500);
        expect(connection.close).not.toHaveBeenCalled();
        jasmine.Clock.tick(2345);
        expect(connection.close).toHaveBeenCalled();
      });
    });

    describe("on connection error", function() {
      it("should emit an error", function() {
        var onError = jasmine.createSpy("onError");
        manager.bind("error", onError);

        connection.emit("error", { boom: "boom" });

        expect(onError).toHaveBeenCalledWith({
          type: "WebSocketError",
          error: { boom: "boom" }
        });
      });
    });

    describe("on ping", function() {
      it("should reply with a pusher:pong event", function() {
        connection.emit("ping");
        expect(connection.send_event).toHaveBeenCalledWith(
          "pusher:pong", {}, undefined
        );
      });
    });

    describe("on offline event", function() {
      it("should send an activity check and disconnect after no pong response", function() {
        Network.emit("offline");
        expect(connection.ping).toHaveBeenCalled();

        jasmine.Clock.tick(2344);
        expect(manager.state).toEqual("connected");

        jasmine.Clock.tick(1);
        expect(manager.state).toEqual("connecting");
      });
    });

    describe("on error callback", function() {
      var errorHandler;
      beforeEach(function() {
        errorHandler = jasmine.createSpy();
        manager.bind("error", errorHandler)
      });
      it("should emit error and disconnect upon receipt of a refused event", function() {
        var error = {code: 4000};
        connection.emit("refused", {error: error});
        expect(manager.state).toEqual("disconnected");
        expect(errorHandler).toHaveBeenCalledWith({
          type: 'WebSocketError',
          error:  error
        });
      });
      it("should emit error and reconnect upon receipt of a tls_only event", function() {
        var error = {code: 4000};
        connection.emit("tls_only", {error: error});
        jasmine.Clock.tick(1);
        expect(manager.state).toEqual("connecting");
        expect(errorHandler).toHaveBeenCalledWith({
          type: 'WebSocketError',
          error:  error
        });
      });
      it("should emit error and reconnect with backoff upon receipt of a backoff event", function() {
        var error = {code: 4100};
        connection.emit("backoff", {error: error});
        jasmine.Clock.tick(1000);
        expect(manager.state).toEqual("connecting");
        expect(errorHandler).toHaveBeenCalledWith({
          type: 'WebSocketError',
          error:  error
        });
      });
      it("should emit error and reconnect upon receipt of a retry event", function() {
        var error = {code: 4200};
        connection.emit("retry", {error: error});
        jasmine.Clock.tick(1);
        expect(manager.state).toEqual("connecting");
        expect(errorHandler).toHaveBeenCalledWith({
          type: 'WebSocketError',
          error:  error
        });
      });
    });
  });

  describe("after establishing a connection which handles activity checks by iself", function() {
    beforeEach(function() {
      manager.connect();
      connection.id = "123.456";
      connection.handlesActivityChecks.andReturn(true);
      strategy._callback(null, {
        action: "connected",
        connection: connection,
        activityTimeout: 999999
      });
    });

    describe("on activity timeout", function() {
      it("should not send a ping or close a connection", function() {
        jasmine.Clock.tick(10000);
        expect(connection.ping).not.toHaveBeenCalled();
        expect(connection.close).not.toHaveBeenCalled();
      });
    });
  });

  describe("on online event", function() {
    it("should retry when in 'connecting' state", function() {
      manager.connect();
      expect(strategy.connect.calls.length).toEqual(1);

      Network.emit("online");
      expect(strategy.connect.calls.length).toEqual(1);
      expect(manager.state).toEqual("connecting");

      jasmine.Clock.tick(1);
      expect(strategy.connect.calls.length).toEqual(2);
    });

    it("should retry when in 'unavailable' state", function() {
      manager.connect();
      expect(strategy.connect.calls.length).toEqual(1);

      jasmine.Clock.tick(1234);
      expect(strategy.connect.calls.length).toEqual(1);
      expect(manager.state).toEqual("unavailable");
      Network.emit("online");

      jasmine.Clock.tick(1);
      expect(strategy.connect.calls.length).toEqual(2);
    });
  });

  describe("on strategy error", function() {
    it("should connect again using the same strategy", function() {
      manager.connect();
      expect(strategy.connect.calls.length).toEqual(1);

      strategy._callback(true);
      expect(strategy.connect.calls.length).toEqual(2);
      expect(manager.state).toEqual("connecting");
    });
  });

  describe("with unsupported strategy", function() {
    it("should transition to failed on connect", function() {
      strategy.isSupported = jasmine.createSpy("isSupported")
        .andReturn(false);

      var onFailed = jasmine.createSpy("onFailed");
      manager.bind("failed", onFailed);

      manager.connect();
      expect(onFailed).toHaveBeenCalled();
    });
  });

  describe("with adjusted activity timeouts", function() {
    var handshake;
    var onConnected;

    beforeEach(function() {
      manager.connect();
      connection.id = "123.456";
    });

    it("should use the activity timeout value from the connection, if it's the lowest", function() {
      connection.activityTimeout = 2666;
      handshake = {
        action: "connected",
        connection: connection,
        activityTimeout: 2667
      };
      strategy._callback(null, handshake);

      jasmine.Clock.tick(2665);
      expect(connection.send_event).not.toHaveBeenCalled();

      jasmine.Clock.tick(1);
      expect(connection.ping).toHaveBeenCalled();
    });

    it("should use the handshake activity timeout value, if it's the lowest", function() {
      connection.activityTimeout = 3455;
      handshake = {
        action: "connected",
        connection: connection,
        activityTimeout: 3400
      };
      strategy._callback(null, handshake);

      jasmine.Clock.tick(3399);
      expect(connection.send_event).not.toHaveBeenCalled();

      jasmine.Clock.tick(1);
      expect(connection.ping).toHaveBeenCalled();
    });

    it("should use the default activity timeout value, if it's the lowest", function() {
      connection.activityTimeout = 5555;
      handshake = {
        action: "connected",
        connection: connection,
        activityTimeout: 3500
      };
      strategy._callback(null, handshake);

      jasmine.Clock.tick(3455);
      expect(connection.send_event).not.toHaveBeenCalled();

      jasmine.Clock.tick(1);
      expect(connection.ping).toHaveBeenCalled();
    });
  });
});
