var TestEnv = require('testenv');
var Pusher = require('pusher_integration');
if (TestEnv === "web") window.Pusher = Pusher;
var Integration = require("integration");
var Mocks = require("mocks");
var Runtime = require('runtime').default;
var Network = require("net_info").Network;
var transports = Runtime.Transports;

if (TestEnv == "web") {
  var BASE_FALLBACK = "sockjs"
} else {
  var BASE_FALLBACK = "xhr_polling"
}

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

    spyOn(Runtime, "getDefaultStrategy").andCallFake(function() {
      return [
        [":def_transport", "a", "ws", 1, {}],
        [":def_transport", "b", "xhr_streaming", 2, {}],
        [":def_transport", "c", BASE_FALLBACK, 3, {}],
        [":def", "strategy", [":best_connected_ever", ":a", ":b", ":c"]]
      ];
    });

    spyOn(Network, "isOnline").andReturn(true);
    Pusher.isReady = true;
  });

  afterEach(function() {
    Pusher.isReady = _isReady;
  });

  it("should use all transports if the whitelist is not specified", function() {
    var pusher = new Pusher("asdf", { disableStats: true });
    expect(transports.ws.createConnection).toHaveBeenCalled();
    expect(transports.xhr_streaming.createConnection).toHaveBeenCalled();
    expect(transports[BASE_FALLBACK].createConnection).toHaveBeenCalled();
    pusher.disconnect();
  });

  it("should not use any transports if the whitelist is empty", function() {
    var pusher = new Pusher("asdf", {
      disableStats: true,
      enabledTransports: []
    });
    expect(transports.ws.createConnection).not.toHaveBeenCalled();
    expect(transports.xhr_streaming.createConnection).not.toHaveBeenCalled();
    expect(transports[BASE_FALLBACK].createConnection).not.toHaveBeenCalled();
    pusher.disconnect();
  });

  it("should use only transports from the whitelist", function() {
    var pusher = new Pusher("asdf", {
      disableStats: true,
      enabledTransports: ["a", "c"]
    });
    expect(transports.ws.createConnection).toHaveBeenCalled();
    expect(transports.xhr_streaming.createConnection).not.toHaveBeenCalled();
    expect(transports[BASE_FALLBACK].createConnection).toHaveBeenCalled();
    pusher.disconnect();
  });

  it("should not use transports from the blacklist", function() {
    var pusher = new Pusher("asdf", {
      disableStats: true,
      disabledTransports: ["a", "b"]
    });
    expect(transports.ws.createConnection).not.toHaveBeenCalled();
    expect(transports.xhr_streaming.createConnection).not.toHaveBeenCalled();
    expect(transports[BASE_FALLBACK].createConnection).toHaveBeenCalled();
    pusher.disconnect();
  });

  it("should not use transports from the blacklist, even if they are on the whitelist", function() {
    var pusher = new Pusher("asdf", {
      disableStats: true,
      enabledTransports: ["b", "c"],
      disabledTransports: ["b"]
    });
    expect(transports.ws.createConnection).not.toHaveBeenCalled();
    expect(transports.xhr_streaming.createConnection).not.toHaveBeenCalled();
    expect(transports[BASE_FALLBACK].createConnection).toHaveBeenCalled();
    pusher.disconnect();
  });
});
