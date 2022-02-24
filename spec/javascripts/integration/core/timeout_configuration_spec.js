var Pusher = require('pusher_integration');
var TestEnv = require('testenv');

if (TestEnv === "web") window.Pusher = Pusher;

var Integration = require("integration");
var Mocks = require("mocks");
var Network = require("net_info").Network;
var util = require("core/util").default;
var Runtime = require('runtime').default;
var transports = Runtime.Transports;
var Defaults = require('core/defaults').default;

if (TestEnv == "web") {
  var BASE_FALLBACK = "sockjs"
} else {
  var BASE_FALLBACK = "xhr_polling"
}

module.exports = function() {
  Integration.describe("Timeout Configuration", function() {
    var transport;
    var pusher;

    beforeEach(function() {
      jasmine.clock().uninstall();
      jasmine.clock().install();

      spyOn(Network, "isOnline").and.returnValue(true);

      spyOn(transports.ws, "isSupported").and.returnValue(true);
      spyOn(transports[BASE_FALLBACK], "isSupported").and.returnValue(false);

      spyOn(Runtime, "getLocalStorage").and.returnValue({});

      spyOn(transports.ws, "createConnection").and.callFake(function() {
        transport = Mocks.getTransport(true);
        transport.supportsPing.and.returnValue(false);
        return transport;
      });
    });

    afterEach(function() {
      pusher.disconnect();
      jasmine.clock().uninstall();
    });

    it("should transition to unavailable after default timeout", function() {
      var onUnavailable = jasmine.createSpy("onUnavailable");

      pusher = new Pusher("foobar");
      pusher.connect();
      pusher.connection.bind("unavailable", onUnavailable);

      jasmine.clock().tick(Defaults.unavailableTimeout - 1);
      expect(onUnavailable).not.toHaveBeenCalled();
      jasmine.clock().tick(1);
      expect(onUnavailable).toHaveBeenCalled();
    });

    it("should transition to unavailable after timeout passed as an option", function() {
      var onUnavailable = jasmine.createSpy("onUnavailable");

      pusher = new Pusher("foobar", { unavailableTimeout: 2345 });
      pusher.connect();
      pusher.connection.bind("unavailable", onUnavailable);

      jasmine.clock().tick(2344);
      expect(onUnavailable).not.toHaveBeenCalled();
      jasmine.clock().tick(1);
      expect(onUnavailable).toHaveBeenCalled();
    });

    it("should obey the server's activity timeout and the default pong timeout", function() {
      pusher = new Pusher("foobar");
      pusher.connect();

      var firstTransport = transport;

      firstTransport.state = "initialized";
      firstTransport.emit("initialized");
      firstTransport.state = "open";
      firstTransport.emit("open");
      firstTransport.emit("message", {
        data: JSON.stringify({
          event: "pusher:connection_established",
          data: {
            socket_id: "123.456",
            activity_timeout: 12
          }
        })
      });

      expect(pusher.connection.state).toEqual("connected");
      jasmine.clock().tick(12000 - 1);
      expect(firstTransport.send).not.toHaveBeenCalled();
      jasmine.clock().tick(1);
      expect(firstTransport.send).toHaveBeenCalled();

      jasmine.clock().tick(Defaults.pongTimeout - 1);
      expect(firstTransport.close).not.toHaveBeenCalled();
      jasmine.clock().tick(2);
      expect(firstTransport.close).toHaveBeenCalled();
    });

    it("should obey the activity timeout from the handshake if it's lower than one specified in options", function() {
      pusher = new Pusher("foobar", {
        activityTimeout: 16000,
        pongTimeout: 2222
      });
      pusher.connect();

      var firstTransport = transport;

      firstTransport.state = "initialized";
      firstTransport.emit("initialized");
      firstTransport.state = "open";
      firstTransport.emit("open");
      firstTransport.emit("message", {
        data: JSON.stringify({
          event: "pusher:connection_established",
          data: {
            socket_id: "123.456",
            activity_timeout: 15
          }
        })
      });

      expect(pusher.connection.state).toEqual("connected");
      jasmine.clock().tick(15000 - 1);
      expect(firstTransport.send).not.toHaveBeenCalled();
      jasmine.clock().tick(1);
      expect(firstTransport.send).toHaveBeenCalled();
    });

    it("should obey the activity timeout specified in options if it's lower than one from the handshake", function() {
      pusher = new Pusher("foobar", {
        activityTimeout: 15555,
        pongTimeout: 2222
      });
      pusher.connect();

      var firstTransport = transport;

      firstTransport.state = "initialized";
      firstTransport.emit("initialized");
      firstTransport.state = "open";
      firstTransport.emit("open");
      firstTransport.emit("message", {
        data: JSON.stringify({
          event: "pusher:connection_established",
          data: {
            socket_id: "123.456",
            activity_timeout: 17
          }
        })
      });

      expect(pusher.connection.state).toEqual("connected");
      jasmine.clock().tick(15555 - 1);
      expect(firstTransport.send).not.toHaveBeenCalled();
      jasmine.clock().tick(1);
      expect(firstTransport.send).toHaveBeenCalled();
    });

    it("should obey the pong timeout passed in options", function() {
      pusher = new Pusher("foobar", {
        pongTimeout: 2222
      });
      pusher.connect();

      var firstTransport = transport;

      firstTransport.state = "initialized";
      firstTransport.emit("initialized");
      firstTransport.state = "open";
      firstTransport.emit("open");
      firstTransport.emit("message", {
        data: JSON.stringify({
          event: "pusher:connection_established",
          data: {
            socket_id: "123.456",
            activity_timeout: 120
          }
        })
      });

      // first, send the ping
      jasmine.clock().tick(120000);
      // wait for the pong timeout
      jasmine.clock().tick(2221);
      expect(firstTransport.close).not.toHaveBeenCalled();
      jasmine.clock().tick(2);
      expect(firstTransport.close).toHaveBeenCalled();
    });
  });
}
