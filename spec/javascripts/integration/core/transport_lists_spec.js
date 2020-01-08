var TestEnv = require('testenv');
var Pusher = require('pusher_integration');
if (TestEnv === "web") window.Pusher = Pusher;
var Integration = require("integration");
var Mocks = require("mocks");
var Runtime = require('runtime').default;
var Network = require("net_info").Network;
var defineTransport = require('core/strategies/strategy_builder').defineTransport;
var BestConnectedEverStrategy = require('core/strategies/best_connected_ever_strategy').default;
var transports = Runtime.Transports;

if (TestEnv == "web") {
  var BASE_FALLBACK = "sockjs"
} else {
  var BASE_FALLBACK = "xhr_polling"
}

module.exports = function() {
  Integration.describe("Transport lists", function() {
    var _isReady = Pusher.isReady;

    beforeEach(function() {
      spyOn(transports.ws, "isSupported").andReturn(true);
      spyOn(transports.xhr_streaming, "isSupported").andReturn(true);
      spyOn(transports[BASE_FALLBACK], "isSupported").andReturn(true);

      spyOn(transports.ws, "createConnection")
        .andCallFake(Mocks.getTransport);
      spyOn(transports.xhr_streaming, "createConnection")
        .andCallFake(Mocks.getTransport);
      spyOn(transports[BASE_FALLBACK], "createConnection")
        .andCallFake(Mocks.getTransport);

      spyOn(Runtime, "getDefaultStrategy").andCallFake(function(config) {
        return new BestConnectedEverStrategy([
          defineTransport(config, 'a', 'ws', 1, {}),
          defineTransport(config, 'b', 'xhr_streaming', 2, {}),
          defineTransport(config, 'c', BASE_FALLBACK, 3, {}),
        ]);
      });

      spyOn(Network, "isOnline").andReturn(true);
      Pusher.isReady = true;
    });

    afterEach(function() {
      Pusher.isReady = _isReady;
    });

    it("should use all transports if the whitelist is not specified", function() {
      var pusher = new Pusher("asdf");
      expect(transports.ws.createConnection).toHaveBeenCalled();
      expect(transports.xhr_streaming.createConnection).toHaveBeenCalled();
      expect(transports[BASE_FALLBACK].createConnection).toHaveBeenCalled();
      pusher.disconnect();
    });

    it("should not use any transports if the whitelist is empty", function() {
      var pusher = new Pusher("asdf", {
        enabledTransports: []
      });
      expect(transports.ws.createConnection).not.toHaveBeenCalled();
      expect(transports.xhr_streaming.createConnection).not.toHaveBeenCalled();
      expect(transports[BASE_FALLBACK].createConnection).not.toHaveBeenCalled();
      pusher.disconnect();
    });

    it("should use only transports from the whitelist", function() {
      var pusher = new Pusher("asdf", {
        enabledTransports: ["a", "c"]
      });
      expect(transports.ws.createConnection).toHaveBeenCalled();
      expect(transports.xhr_streaming.createConnection).not.toHaveBeenCalled();
      expect(transports[BASE_FALLBACK].createConnection).toHaveBeenCalled();
      pusher.disconnect();
    });

    it("should not use transports from the blacklist", function() {
      var pusher = new Pusher("asdf", {
        disabledTransports: ["a", "b"]
      });
      expect(transports.ws.createConnection).not.toHaveBeenCalled();
      expect(transports.xhr_streaming.createConnection).not.toHaveBeenCalled();
      expect(transports[BASE_FALLBACK].createConnection).toHaveBeenCalled();
      pusher.disconnect();
    });

    it("should not use transports from the blacklist, even if they are on the whitelist", function() {
      var pusher = new Pusher("asdf", {
        enabledTransports: ["b", "c"],
        disabledTransports: ["b"]
      });
      expect(transports.ws.createConnection).not.toHaveBeenCalled();
      expect(transports.xhr_streaming.createConnection).not.toHaveBeenCalled();
      expect(transports[BASE_FALLBACK].createConnection).toHaveBeenCalled();
      pusher.disconnect();
    });
  });
}
