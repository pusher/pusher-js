var Integration = require("../helpers/integration");
var Mocks = require("../helpers/mocks");

var Pusher = require("pusher");

var Network = require('pusher-websocket-iso-externals-node/net_info').Network;
var Timer = require("utils/timers").Timer;
var transports = require("transports/transports");
var util = require("util");

Integration.describe("Falling back", function() {
  var pusher;

  beforeEach(function() {
    spyOn(Network, "isOnline").andReturn(true);

    spyOn(transports.WSTransport, "isSupported").andReturn(false);
    spyOn(transports.XDRStreamingTransport, "isSupported").andReturn(false);
    spyOn(transports.XHRStreamingTransport, "isSupported").andReturn(false);
    spyOn(transports.XDRPollingTransport, "isSupported").andReturn(false);
    spyOn(transports.XHRPollingTransport, "isSupported").andReturn(false);

    spyOn(util, "getLocalStorage").andReturn({});
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

  it("should not close established XHR connection when WebSocket is stuck in handshake", function() {
    var wsTransport, xhrTransport;

    function createWSConnection() {
      wsTransport = Mocks.getTransport(true);
      return wsTransport;
    }
    function createXHRConnection() {
      xhrTransport = Mocks.getTransport(true);
      return xhrTransport;
    }

    transports.WSTransport.isSupported.andReturn(true);
    transports.XHRStreamingTransport.isSupported.andReturn(true);
    spyOn(transports.WSTransport, "createConnection").andCallFake(createWSConnection);
    spyOn(transports.XHRStreamingTransport, "createConnection").andCallFake(createXHRConnection);

    runs(function() {
      // Use encrypted to skip the WSS fallback
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
      return transports.XHRStreamingTransport.createConnection.calls.length === 1;
    }, "XHR connection to be created", 3000);
    runs(function() {
      xhrTransport.state = "initialized";
      xhrTransport.emit("initialized");
    });
    waitsFor(function() {
      return xhrTransport.connect.calls.length === 1;
    }, "connect on XHR to be called", 500);
    runs(function() {
      xhrTransport.state = "open";
      xhrTransport.emit("open");
      xhrTransport.emit("message", {
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
      // this causes a connection to be retried after 1s
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
      expect(xhrTransport.close).not.toHaveBeenCalled();
    });
  });
});
