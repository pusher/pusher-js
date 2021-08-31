const TestEnv = require('testenv');
const Mocks = require('mocks');
const TransportConnection = require('core/transports/transport_connection').default;
const Collections = require('core/utils/collections');
const OneOffTimer = require('core/utils/timers').OneOffTimer;
const Dependencies = require('dom/dependencies').Dependencies;
const waitsFor = require('../../../helpers/waitsFor');

describe("TransportConnection", function() {
  function getTransport(hooks, key, options) {
    options = Collections.extend({
      useTLS: false,
      hostNonTLS: "example.com:12345",
      hostTLS: "example.com:54321"
    }, options);

    return new TransportConnection(hooks, "test", 7, key, options);
  }

  var urls;
  var hooks;
  var socket;
  var timeline;
  var transport;
  var _DependenciesBackup;

  beforeEach(function() {
    if (TestEnv === "web") {
      _DependenciesBackup = {
        load: Dependencies.load,
        getRoot: Dependencies.getRoot,
        getPath: Dependencies.getPath
      }
      Dependencies.load = jasmine.createSpy("load")
      Dependencies.getRoot = jasmine.createSpy("getRoot")
      Dependencies.getPath = jasmine.createSpy("getPath")
    }

    timeline = Mocks.getTimeline();
    timeline.generateUniqueID.and.returnValue(667);

    urls = {
      getInitial: function(key, params) {
        return (params.useTLS ? "wss" : "ws") + "://test/" + key;
      }
    };
    socket = Mocks.getWebSocket();
    hooks = {
      urls: urls,
      supportsPing: false,
      isInitialized: jasmine.createSpy().and.returnValue(true),
      getSocket: jasmine.createSpy().and.returnValue(socket)
    };

    transport = getTransport(hooks, "foo", {
      timeline: timeline
    });
  });

  afterEach(function(){
    if (TestEnv === "web") {
      Dependencies.load = _DependenciesBackup.load
      Dependencies.getRoot = _DependenciesBackup.getRoot
      Dependencies.getPath = _DependenciesBackup.getPath
    }
  });

  describe("#activityTimeout", function() {
    it("should be set to the value passed via options", function() {
      var transport = getTransport(hooks, "xxx", {
        timeline: timeline,
        activityTimeout: 654321
      });
      expect(transport.activityTimeout).toEqual(654321);
    });

    it("should be set to undefined if not passed via options", function() {
      var transport = getTransport(hooks, "xxx", {
        timeline: timeline
      });
      expect(transport.activityTimeout).toBe(undefined);
    });
  });

  describe("#initialize", function() {
    it("should log transport name with info level", function() {
      transport.initialize();
      expect(timeline.info).toHaveBeenCalledWith({
        cid: 667,
        transport: "test"
      });
    });

    it("should log transport name with an 's' suffix when using TLS", function() {
      var transport = getTransport(hooks, "xxx", {
        timeline: timeline,
        useTLS: true
      });
      transport.initialize();

      expect(timeline.info).toHaveBeenCalledWith({
        cid: 667,
        transport: "tests"
      });
    });

    describe("if the transport is initialized", function() {
      var hooks;
      var transport;

      beforeEach(function() {
        hooks = {
          supportsPing: false,
          isInitialized: jasmine.createSpy().and.returnValue(true)
        };
        transport = getTransport(hooks, "foo", {
          timeline: timeline
        });
      });

      it("should transition to 'initialized' immediately", function() {
        var onInitialized = jasmine.createSpy("onInitialized");
        transport.bind("initialized", onInitialized);

        transport.initialize();
        expect(onInitialized).toHaveBeenCalled();
        expect(transport.state).toEqual("initialized");
      });

    });

    describe("if the transport is not initialized", function() {
      var hooks, transport;

      beforeEach(function() {
        hooks = {
          file: "test",
          isInitialized: jasmine.createSpy().and.returnValue(false),
          getSocket: jasmine.createSpy().and.returnValue(socket)
        };
        transport = getTransport(hooks, "foo", {
          timeline: timeline
        });
      });

      if (TestEnv === "web") {
        it("should transition to 'initializing' immediately", function() {
          var onInitializing = jasmine.createSpy("onInitializing");
          transport.bind("initializing", onInitializing);

          transport.initialize();
          expect(onInitializing).toHaveBeenCalled();
          expect(transport.state).toEqual("initializing");
        });

        it("should load the resource file (useTLS=false)", function() {
          transport.initialize();
          expect(Dependencies.load.calls.count()).toEqual(1);
          expect(Dependencies.load).toHaveBeenCalledWith(
            "test", { useTLS: false }, jasmine.any(Function)
          );
        });

        it("should load the resource file (useTLS=true)", function() {
          var transport = getTransport(hooks, "foo", {
            useTLS: true,
            timeline: timeline
          });

          transport.initialize();
          expect(Dependencies.load.calls.count()).toEqual(1);
          expect(Dependencies.load).toHaveBeenCalledWith(
            "test", { useTLS: true }, jasmine.any(Function)
          );
        });

        describe("after loading the resource successfully", function() {
          var onInitialized;
          var loadCallback;

          beforeEach(function() {
            onInitialized = jasmine.createSpy("onInitialized");
            loadCallback = jasmine.createSpy("loadCallback");
            transport.bind("initialized", onInitialized);

            transport.initialize();
            // after loading the resource, isInitialized will return true
            hooks.isInitialized.and.returnValue(true);
            // fire the callback for the resource file load
            Dependencies.load.calls.first().args[2](null, loadCallback);
          });

          it("should transition to 'initialized'", function() {
            expect(onInitialized).toHaveBeenCalled();
            expect(transport.state).toEqual("initialized");
          });

          it("should call the load callback with true", function() {
            expect(loadCallback).toHaveBeenCalledWith(true);
          });
        });

        describe("after failing to load the resource", function() {
          var onClosed;
          var loadCallback;

          beforeEach(function() {
            onClosed = jasmine.createSpy("onClosed");
            loadCallback = jasmine.createSpy("loadCallback");
            transport.bind("closed", onClosed);

            transport.initialize();
            // after loading the resource, isInitialized will return true
            hooks.isInitialized.and.returnValue(false);
            // fire the callback for the resource file load
            Dependencies.load.calls.first().args[2](null, loadCallback);
          });

          it("should transition to 'closed'", function() {
            expect(onClosed).toHaveBeenCalled();
            expect(transport.state).toEqual("closed");
          });

          it("should call the load callback with false", function() {
            expect(loadCallback).toHaveBeenCalledWith(false);
          });
        });
      }
    });
  });

  describe("#connect", function() {
    it("should not create a socket if not initialized", function() {
      transport.connect();
      expect(hooks.getSocket).not.toHaveBeenCalled();
    });

    it("should create a non TLS socket by default", function() {
      transport.initialize();
      transport.connect();
      expect(hooks.getSocket).toHaveBeenCalledWith(
        "ws://test/foo", transport.options
      );
    });

    it("should create a TLS socket if specified", function() {
      var transport = getTransport(hooks, "bar", {
        timeline: timeline,
        useTLS: true
      });

      transport.initialize();
      transport.connect();
      expect(hooks.getSocket).toHaveBeenCalledWith(
        "wss://test/bar", transport.options
      );
    });

    it("should not transition to 'connecting' if not initialized", function() {
      var onConnecting = jasmine.createSpy("onConnecting");
      transport.bind("connecting", onConnecting);

      transport.connect();
      expect(transport.state).toEqual("new");
      expect(onConnecting).not.toHaveBeenCalled();
    });

    it("should transition to 'connecting'", function() {
      var onConnecting = jasmine.createSpy("onConnecting");
      transport.bind("connecting", onConnecting);

      transport.initialize();
      transport.connect();
      expect(transport.state).toEqual("connecting");
      expect(onConnecting.calls.count()).toEqual(1);
    });

    it("should transition to 'open' after connection is established", function() {
      var onOpen = jasmine.createSpy("onOpen");
      transport.bind("open", onOpen);

      transport.initialize();
      transport.connect();
      socket.onopen();

      expect(transport.state).toEqual("open");
      expect(onOpen.calls.count()).toEqual(1);
    });

    it("should emit the error raised by getSocket", async function() {
      hooks.getSocket.and.throwError("test exception");

      var onError = jasmine.createSpy("onError");
      transport.bind("error", onError);

      transport.initialize();
      transport.connect();

      await waitsFor(function() {
        return onError.calls.count();
      }, "error to be emitted", 50);

      expect(onError.calls.count()).toBeGreaterThan(0);
      expect(onError.calls.count()).toEqual(1);
      expect(onError).toHaveBeenCalledWith({
        type: "WebSocketError",
        error: new Error ("test exception")
      });
    });

    it("should transition to 'closed' when getSocket raises an error", async function() {
      hooks.getSocket.and.throwError("test exception");

      var onClosed = jasmine.createSpy("onClosed");
      transport.bind("closed", onClosed);

      transport.initialize();
      transport.connect();

      await waitsFor(function () {
        return onClosed.calls.count();
      }, "transitioning to 'closed'", 50);

      expect(onClosed.calls.count()).toBeGreaterThan(0);
      expect(onClosed.calls.count()).toEqual(1);
      expect(transport.state).toEqual("closed");
    });

    it("should be idempotent", function() {
      transport.initialize();

      transport.connect();
      expect(hooks.getSocket.calls.count()).toEqual(1);
      expect(transport.state).toEqual("connecting");

      var onConnecting = jasmine.createSpy("onConnecting");
      transport.bind("connecting", onConnecting);

      transport.connect();
      expect(transport.state).toEqual("connecting");
      expect(hooks.getSocket.calls.count()).toEqual(1);
      expect(onConnecting).not.toHaveBeenCalled();
    });
  });

  describe("#send", function() {
    beforeEach(function() {
      transport.initialize();
      transport.connect();
      socket.onopen();
    });

    it("should defer sending data to the socket", async function() {
      socket.send.calls.reset();

      expect(socket.send).not.toHaveBeenCalled();

      let sendCall = transport.send('foobar');

      await waitsFor(function () {
        return socket.send.calls.count();
      }, "socket.send to be called", 50);

      expect(sendCall).toBe(true);
      expect(socket.send.calls.count()).toEqual(1);
      expect(socket.send).toHaveBeenCalledWith("foobar");
    });

    it("should not crash when socket is closed before next tick (will log to console only)", async function() {
      transport.send("foobar");
      transport.close();
      socket.onclose({ wasClean: true });
      var timer = new OneOffTimer(100, function() {});

      await waitsFor(function () {
        return !timer.isRunning();
      }, "timer to run", 500);
    });
  });

  describe("#ping", function() {
    beforeEach(function() {
    });

    it("should call ping on the socket, if it supports it", function() {
      var hooks = {
        urls: urls,
        supportsPing: true,
        isInitialized: jasmine.createSpy().and.returnValue(true),
        getSocket: jasmine.createSpy().and.returnValue(socket)
      };
      var transport = getTransport(hooks, "foo", {
        timeline: timeline
      });
      socket.ping = jasmine.createSpy("ping");

      transport.initialize();
      transport.connect();
      socket.onopen();

      expect(socket.ping).not.toHaveBeenCalled();
      transport.ping();
      expect(socket.ping).toHaveBeenCalled();
    });

    it("should not fail if socket does not support ping", function() {
      var hooks = {
        urls: urls,
        supportsPing: false,
        isInitialized: jasmine.createSpy().and.returnValue(true),
        getSocket: jasmine.createSpy().and.returnValue(socket)
      };
      var transport = getTransport(hooks, "foo", {
        timeline: timeline
      });

      transport.initialize();
      transport.connect();
      socket.onopen();

      transport.ping();
    });
  });

  describe("#close", function() {
    it("should call close on the socket and emit a 'closed' event", function() {
      var onClosed = jasmine.createSpy("onClosed");
      transport.bind("closed", onClosed);

      transport.initialize();
      transport.connect();
      socket.onopen();

      transport.close();
      expect(socket.close).toHaveBeenCalled();
      expect(onClosed).not.toHaveBeenCalled();

      socket.onclose({ wasClean: true });
      expect(onClosed).toHaveBeenCalledWith({ wasClean: true, code: undefined, reason: undefined });
    });

    it("should not fail if not open", function() {
      transport.close();
    });
  });

  describe("after receiving a message", function() {
    beforeEach(function() {
      transport.initialize();
      transport.connect();
      socket.onopen();
    });

    it("should emit message event with received object", function() {
      var onMessage = jasmine.createSpy("onMessage");
      transport.bind("message", onMessage);

      socket.onmessage("ugabuga");

      expect(transport.state).toEqual("open");
      expect(onMessage).toHaveBeenCalledWith("ugabuga");
    });
  });

  describe("after receiving an activity event if the socket supports ping", function() {
    var hooks;
    var transport;

    beforeEach(function() {
      hooks = {
        urls: urls,
        supportsPing: true,
        isInitialized: jasmine.createSpy().and.returnValue(true),
        getSocket: jasmine.createSpy().and.returnValue(socket)
      };
      transport = getTransport(hooks, "foo", {
        timeline: timeline
      });

      transport.initialize();
      transport.connect();
      socket.onopen();
    });

    it("should emit an 'activity' event", function() {
      var onActivity = jasmine.createSpy("onActivity");
      transport.bind("activity", onActivity);

      socket.onactivity();
      expect(onActivity).toHaveBeenCalled();
    });
  });

  describe("after receiving an error", function() {
    beforeEach(function() {
      transport.initialize();
      transport.connect();
    });

    it("should emit errors", function() {
      var onError = jasmine.createSpy("onError");
      transport.bind("error", onError);

      socket.onerror({ test: "We're doomed" });

      // should emit the whole error, not stringify it
      expect(onError).toHaveBeenCalledWith({
        type: "WebSocketError",
        error: {
          test: "We're doomed"
        }
      });
      expect(onError.calls.count()).toEqual(1);
    });

    it("should emit a closed event with correct params", function() {
      var onClosed = jasmine.createSpy("onClosed");
      transport.bind("closed", onClosed);

      socket.onclose({
        code: 1234,
        reason: "testing",
        wasClean: true,
        foo: "bar"
      });

      expect(onClosed).toHaveBeenCalledWith({
        code: 1234,
        reason: "testing",
        wasClean: true
      });
      expect(onClosed.calls.count()).toEqual(1);
      expect(transport.state).toEqual("closed");
    });

    it("should emit a closed events without params when no details were provided", function() {
      var onClosed = jasmine.createSpy("onClosed");
      transport.bind("closed", onClosed);

      socket.onclose();

      expect(onClosed).toHaveBeenCalled();
      expect(onClosed.calls.count()).toEqual(1);
    });

    it("should log an error as a string to timeline", function() {
      socket.onerror({ toString: function() { return "error message"; }});
      expect(timeline.error).toHaveBeenCalledWith({
        cid: 667,
        error: "error message"
      });
    });
  });

  describe("on state change", function () {
    it("should log the new state to timeline", function() {
      transport.initialize();

      expect(timeline.info.calls.count()).toEqual(2);
      expect(timeline.info).toHaveBeenCalledWith({
        cid: 667,
        transport: "test"
      });
      expect(timeline.info).toHaveBeenCalledWith({
        cid: 667,
        state: "initialized",
        params: undefined,
      });

      transport.connect();

      expect(timeline.info.calls.count()).toEqual(3);
      expect(timeline.info).toHaveBeenCalledWith({
        cid: 667,
        state: "connecting",
        params: undefined,
      });
    });
  });
});
