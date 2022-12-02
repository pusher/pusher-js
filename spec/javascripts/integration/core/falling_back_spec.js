const TestEnv = require('testenv');
const Pusher = require('pusher_integration');

if (TestEnv === "web") window.Pusher = Pusher;

const Integration = require('integration');
const Mocks = require("mocks");
const Network = require('net_info').Network;
const OneOffTimer = require('core/utils/timers').OneOffTimer;
const Runtime = require('runtime').default;
const transports = Runtime.Transports;
const waitsFor = require('../../helpers/waitsFor')

module.exports = function() {
  Integration.describe("Falling back", function() {
    var pusher;

    beforeEach(function() {
      spyOn(Network, "isOnline").and.returnValue(true);

      spyOn(transports.ws, "isSupported").and.returnValue(false);
      spyOn(transports.xhr_streaming, "isSupported").and.returnValue(false);
      spyOn(transports.xhr_polling, "isSupported").and.returnValue(false);

      if (TestEnv === "web") {
        spyOn(transports.sockjs, "isSupported").and.returnValue(false);
        spyOn(transports.xdr_streaming, "isSupported").and.returnValue(false);
        spyOn(transports.xdr_polling, "isSupported").and.returnValue(false);
      }

      spyOn(Runtime, "getLocalStorage").and.returnValue({});
    });

    afterEach(function() {
      pusher.disconnect();
    });

    it("should disable WebSockets after two broken connections", async function() {
      var transport;

      function createConnection() {
        transport = Mocks.getTransport(true);
        return transport;
      }

      transports.ws.isSupported.and.returnValue(true);
      spyOn(transports.ws, "createConnection").and.callFake(createConnection);

      var timer;

      pusher = new Pusher("foobar", {cluster: "mt1"});
      pusher.connect();

      await waitsFor(function() {
        return transports.ws.createConnection.calls.count() === 1;
      }, "WS connection to be created", 500);

      transport.state = "initialized";
      transport.emit("initialized");

      await waitsFor(function() {
        return transport.connect.calls.count() === 1;
      }, "connect to be called", 500);

      transport.state = "open";
      transport.emit("open");

      var timer = new OneOffTimer(100, function() {
        transport.emit("closed", {
          code: 1006,
          reason: "KABOOM!",
          wasClean: false
        });
      });

      await waitsFor(function() {
        return transports.ws.createConnection.calls.count() === 2;
      }, "WS connection to be created", 1500);

      transport.state = "initialized";
      transport.emit("initialized");

      await waitsFor(function() {
        return transport.connect.calls.count() === 1;
      }, "connect to be called", 500);

      transport.state = "open";
      transport.emit("open");

      timer = new OneOffTimer(100, function() {
        transport.emit("closed", {
          code: 1006,
          reason: "KABOOM! AGAIN!",
          wasClean: false
        });
      });


      await waitsFor(function() {
        return !timer.isRunning();
      }, "the transport to close", 200);

      timer = new OneOffTimer(500, function() {});

      await waitsFor(function() {
        return !timer.isRunning();
      }, "a while", 600);

      expect(transports.ws.createConnection.calls.count()).toEqual(2);
      pusher.disconnect();
    });

    if (TestEnv === "web") {
      it("should not close established SockJS connection when WebSocket is stuck in handshake", async function() {
        var wsTransport, sockjsTransport;

        function createWSConnection() {
          wsTransport = Mocks.getTransport(true);
          return wsTransport;
        }
        function createSockJSConnection() {
          sockjsTransport = Mocks.getTransport(true);
          return sockjsTransport;
        }

        transports.ws.isSupported.and.returnValue(true);
        transports.sockjs.isSupported.and.returnValue(true);
        spyOn(transports.ws, "createConnection").and.callFake(createWSConnection);
        spyOn(transports.sockjs, "createConnection").and.callFake(createSockJSConnection);


        // use TLS connection, to force sockjs to be the primary fallback
        pusher = new Pusher("foobar", { cluster: "mt1", forceTLS: true });
        pusher.connect();

        await waitsFor(function() {
          return transports.ws.createConnection.calls.count() === 1;
        }, "WS connection to be created", 500);

        wsTransport.state = "initialized";
        wsTransport.emit("initialized");

        await waitsFor(function() {
          return wsTransport.connect.calls.count() === 1;
        }, "connect on WS to be called", 500);

        wsTransport.state = "open";
        wsTransport.emit("open");
        // start handshake, but don't do anything

        await waitsFor(function() {
          return transports.sockjs.createConnection.calls.count() === 1;
        }, "SockJS connection to be created", 3000);

        sockjsTransport.state = "initialized";
        sockjsTransport.emit("initialized");

        await waitsFor(function() {
          return sockjsTransport.connect.calls.count() === 1;
        }, "connect on SockJS to be called", 500);

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

        await waitsFor(function() {
          return wsTransport.close.calls.count() === 1;
        }, "close on WS to be called", 500);

        var timer;
        // this caused a connection to be retried after 1s
        wsTransport.emit("closed", {
          code: 1000,
          wasClean: true,
          reason: "clean"
        });
        timer = new OneOffTimer(2000, function() {});

        await waitsFor(function() {
          return !timer.isRunning();
        }, "timer to be called", 2500);

        expect(sockjsTransport.close).not.toHaveBeenCalled();
      });
    }
  });
}
