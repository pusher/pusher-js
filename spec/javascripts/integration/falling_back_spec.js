var Pusher = require('pusher_integration').default;
window.Pusher = Pusher;

var Integration = require("../helpers/integration");
var Mocks = require("../helpers/mocks");
var Network = require('pusher-websocket-iso-externals-node/net_info').Network;
var Timer = require("utils/timers").OneOffTimer;
var transports = require("transports/transports").default;
var util = require("util").default;
var Runtime = require('runtimes/runtime').default;
var Timer = require('utils/timers').OneOffTimer;

Integration.describe("Falling back", function() {
  var pusher;

  beforeEach(function() {
    spyOn(Network, "isOnline").andReturn(true);

    spyOn(transports.WSTransport, "isSupported").andReturn(false);
    spyOn(transports.SockJSTransport, "isSupported").andReturn(false);
    spyOn(transports.XDRStreamingTransport, "isSupported").andReturn(false);
    spyOn(transports.XHRStreamingTransport, "isSupported").andReturn(false);
    spyOn(transports.XDRPollingTransport, "isSupported").andReturn(false);
    spyOn(transports.XHRPollingTransport, "isSupported").andReturn(false);

    spyOn(Runtime, "getLocalStorage").andReturn({});
  });

  afterEach(function() {
    pusher.disconnect();
  });

  it("should disable WebSockets after two broken connections", function() {
    var transport;

    function createConnection() {
      transport = Mocks.getTransport(true);
      return transport;
    }

    transports.WSTransport.isSupported.andReturn(true);
    spyOn(transports.WSTransport, "createConnection").andCallFake(createConnection);

    var timer;
    runs(function() {
      pusher = new Pusher("foobar", { disableStats: true });
      pusher.connect();
    });
    waitsFor(function() {
      return transports.WSTransport.createConnection.calls.length === 1;
    }, "WS connection to be created", 500);
    runs(function() {
      transport.state = "initialized";
      transport.emit("initialized");
    });
    waitsFor(function() {
      return transport.connect.calls.length === 1;
    }, "connect to be called", 500);
    runs(function() {
      transport.state = "open";
      transport.emit("open");

      var timer = new Timer(100, function() {
        transport.emit("closed", {
          code: 1006,
          reason: "KABOOM!",
          wasClean: false
        });
      });
    });
    waitsFor(function() {
      return transports.WSTransport.createConnection.calls.length === 2;
    }, "WS connection to be created", 1500);
    runs(function() {
      transport.state = "initialized";
      transport.emit("initialized");
    });
    waitsFor(function() {
      return transport.connect.calls.length === 1;
    }, "connect to be called", 500);
    runs(function() {
      transport.state = "open";
      transport.emit("open");

      timer = new Timer(100, function() {
        transport.emit("closed", {
          code: 1006,
          reason: "KABOOM! AGAIN!",
          wasClean: false
        });
      });
    });
    waitsFor(function() {
      return !timer.isRunning();
    }, "the transport to close", 200);
    runs(function() {
      timer = new Timer(500, function() {});
    });
    waitsFor(function() {
      return !timer.isRunning();
    }, "a while", 600);
    runs(function() {
      expect(transports.WSTransport.createConnection.calls.length).toEqual(2);
      pusher.disconnect();
    });
  });

  it("should not close established SockJS connection when WebSocket is stuck in handshake", function() {
    var wsTransport, sockjsTransport;

    function createWSConnection() {
      wsTransport = Mocks.getTransport(true);
      return wsTransport;
    }
    function createSockJSConnection() {
      sockjsTransport = Mocks.getTransport(true);
      return sockjsTransport;
    }

    transports.WSTransport.isSupported.andReturn(true);
    transports.SockJSTransport.isSupported.andReturn(true);
    spyOn(transports.WSTransport, "createConnection").andCallFake(createWSConnection);
    spyOn(transports.SockJSTransport, "createConnection").andCallFake(createSockJSConnection);

    runs(function() {
      // use encrypted connection, to force sockjs to be the primary fallback
      pusher = new Pusher("foobar", { encrypted: true, disableStats: true });
      pusher.connect();
    });
    waitsFor(function() {
      return transports.WSTransport.createConnection.calls.length === 1;
    }, "WS connection to be created", 500);
    runs(function() {
      wsTransport.state = "initialized";
      wsTransport.emit("initialized");
    });
    waitsFor(function() {
      return wsTransport.connect.calls.length === 1;
    }, "connect on WS to be called", 500);
    runs(function() {
      wsTransport.state = "open";
      wsTransport.emit("open");
      // start handshake, but don't do anything
    });
    waitsFor(function() {
      return transports.SockJSTransport.createConnection.calls.length === 1;
    }, "SockJS connection to be created", 3000);
    runs(function() {
      sockjsTransport.state = "initialized";
      sockjsTransport.emit("initialized");
    });
    waitsFor(function() {
      return sockjsTransport.connect.calls.length === 1;
    }, "connect on SockJS to be called", 500);
    runs(function() {
      sockjsTransport.state = "open";
      sockjsTransport.emit("open");
      sockjsTransport.emit("message", {
        data: JSON.stringify({
          event: "pusher:connection_established",
          data: {
            socket_id: "123.456",
            activity_timeout: 120
          }
        })
      });
    });
    waitsFor(function() {
      return wsTransport.close.calls.length === 1;
    }, "close on WS to be called", 500);

    var timer;
    runs(function() {
      // this caused a connection to be retried after 1s
      wsTransport.emit("closed", {
        code: 1000,
        wasClean: true,
        reason: "clean"
      });
      timer = new Timer(2000, function() {});
    });
    waitsFor(function() {
      return !timer.isRunning();
    }, "timer to be called", 2500);
    runs(function() {
      expect(sockjsTransport.close).not.toHaveBeenCalled();
    });
  });
});
