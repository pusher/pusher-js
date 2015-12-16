var Integration = require("../helpers/integration");
var Mocks = require("../helpers/mocks");

var Pusher = require("pusher");

var defaults = require("defaults");
var Network = require("pusher-websocket-iso-externals-node/net_info").Network;
var transports = require("transports/transports");

Integration.describe("Transport lists", function() {
  beforeEach(function() {
    spyOn(transports.WSTransport, "isSupported").andReturn(true);
    spyOn(transports.XHRStreamingTransport, "isSupported").andReturn(true);
    spyOn(transports.XHRPollingTransport, "isSupported").andReturn(true);

    spyOn(transports.WSTransport, "createConnection")
      .andCallFake(Mocks.getTransport);
    spyOn(transports.XHRStreamingTransport, "createConnection")
      .andCallFake(Mocks.getTransport);
    spyOn(transports.XHRPollingTransport, "createConnection")
      .andCallFake(Mocks.getTransport);

    spyOn(defaults, "getDefaultStrategy").andCallFake(function() {
      return [
        [":def_transport", "a", "ws", 1, {}],
        [":def_transport", "b", "xhr_streaming", 2, {}],
        [":def_transport", "c", "xhr_polling", 3, {}],
        [":def", "strategy", [":best_connected_ever", ":a", ":b", ":c"]]
      ];
    });

    spyOn(Network, "isOnline").andReturn(true);
  });

  it("should use all transports if the whitelist is not specified", function() {
    var pusher = new Pusher("asdf", { disableStats: true });
    expect(transports.WSTransport.createConnection).toHaveBeenCalled();
    expect(transports.XHRStreamingTransport.createConnection).toHaveBeenCalled();
    expect(transports.XHRPollingTransport.createConnection).toHaveBeenCalled();
    pusher.disconnect();
  });

  it("should not use any transports if the whitelist is empty", function() {
    var pusher = new Pusher("asdf", {
      disableStats: true,
      enabledTransports: []
    });
    expect(transports.WSTransport.createConnection).not.toHaveBeenCalled();
    expect(transports.XHRStreamingTransport.createConnection).not.toHaveBeenCalled();
    expect(transports.XHRPollingTransport.createConnection).not.toHaveBeenCalled();
    pusher.disconnect();
  });

  it("should use only transports from the whitelist", function() {
    var pusher = new Pusher("asdf", {
      disableStats: true,
      enabledTransports: ["a", "c"]
    });
    expect(transports.WSTransport.createConnection).toHaveBeenCalled();
    expect(transports.XHRStreamingTransport.createConnection).not.toHaveBeenCalled();
    expect(transports.XHRPollingTransport.createConnection).toHaveBeenCalled();
    pusher.disconnect();
  });

  it("should not use transports from the blacklist", function() {
    var pusher = new Pusher("asdf", {
      disableStats: true,
      disabledTransports: ["a", "b"]
    });
    expect(transports.WSTransport.createConnection).not.toHaveBeenCalled();
    expect(transports.XHRStreamingTransport.createConnection).not.toHaveBeenCalled();
    expect(transports.XHRPollingTransport.createConnection).toHaveBeenCalled();
    pusher.disconnect();
  });

  it("should not use transports from the blacklist, even if they are on the whitelist", function() {
    var pusher = new Pusher("asdf", {
      disableStats: true,
      enabledTransports: ["b", "c"],
      disabledTransports: ["b"]
    });
    expect(transports.WSTransport.createConnection).not.toHaveBeenCalled();
    expect(transports.XHRStreamingTransport.createConnection).not.toHaveBeenCalled();
    expect(transports.XHRPollingTransport.createConnection).toHaveBeenCalled();
    pusher.disconnect();
  });
});
