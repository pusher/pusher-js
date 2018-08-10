var TestEnv = require('testenv');
var Pusher = require('pusher_integration');

if (TestEnv === "web") window.Pusher = Pusher;

var Integration = require("integration");
var Mocks = require("mocks");
var Network = require('net_info').Network;
var Timer = require("core/utils/timers").OneOffTimer;
var util = require("core/util").default;
var Runtime = require('runtime').default;
var transports = Runtime.Transports;
var Timer = require('core/utils/timers').OneOffTimer;

Integration.describe("Falling back", function() {
  var pusher;

  beforeEach(function() {
    spyOn(Network, "isOnline").andReturn(true);

    spyOn(transports.ws, "isSupported").andReturn(false);
    spyOn(transports.xhr_streaming, "isSupported").andReturn(false);
    spyOn(transports.xhr_polling, "isSupported").andReturn(false);

    if (TestEnv === "web") {
      spyOn(transports.sockjs, "isSupported").andReturn(false);
      spyOn(transports.xdr_streaming, "isSupported").andReturn(false);
      spyOn(transports.xdr_polling, "isSupported").andReturn(false);
    }

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

    transports.ws.isSupported.andReturn(true);
    spyOn(transports.ws, "createConnection").andCallFake(createConnection);

    var timer;
    runs(function() {
      pusher = new Pusher("foobar", { disableStats: true });
      pusher.connect();
    });
    waitsFor(function() {
      return transports.ws.createConnection.calls.length === 1;
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
      return transports.ws.createConnection.calls.length === 2;
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
      expect(transports.ws.createConnection.calls.length).toEqual(2);
      pusher.disconnect();
    });
  });

  if (TestEnv === "web") {
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

      transports.ws.isSupported.andReturn(true);
      transports.sockjs.isSupported.andReturn(true);
      spyOn(transports.ws, "createConnection").andCallFake(createWSConnection);
      spyOn(transports.sockjs, "createConnection").andCallFake(createSockJSConnection);

      runs(function() {
        // use TLS connection, to force sockjs to be the primary fallback
        pusher = new Pusher("foobar", { forceTLS: true, disableStats: true });
        pusher.connect();
      });
      waitsFor(function() {
        return transports.ws.createConnection.calls.length === 1;
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
        return transports.sockjs.createConnection.calls.length === 1;
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
  }
});
