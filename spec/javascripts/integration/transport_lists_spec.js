var Pusher = require('pusher_integration').default;
window.Pusher = Pusher;
var Integration = require("../helpers/integration");
var Mocks = require("../helpers/mocks");
var defaults = require("defaults").default;
var Network = require("pusher-websocket-iso-externals-node/net_info").Network;
var transports = require("transports/transports").default;

Integration.describe("Transport lists", function() {
  var _isReady = Pusher.isReady;

  beforeEach(function() {
    spyOn(transports.WSTransport, "isSupported").andReturn(true);
    spyOn(transports.XHRStreamingTransport, "isSupported").andReturn(true);
    spyOn(transports.SockJSTransport, "isSupported").andReturn(true);

    spyOn(transports.WSTransport, "createConnection")
      .andCallFake(Mocks.getTransport);
    spyOn(transports.XHRStreamingTransport, "createConnection")
      .andCallFake(Mocks.getTransport);
    spyOn(transports.SockJSTransport, "createConnection")
      .andCallFake(Mocks.getTransport);

    spyOn(defaults, "getDefaultStrategy").andCallFake(function() {
      return [
        [":def_transport", "a", "ws", 1, {}],
        [":def_transport", "b", "xhr_streaming", 2, {}],
        [":def_transport", "c", "sockjs", 3, {}],
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
    expect(transports.WSTransport.createConnection).toHaveBeenCalled();
    expect(transports.XHRStreamingTransport.createConnection).toHaveBeenCalled();
    expect(transports.SockJSTransport.createConnection).toHaveBeenCalled();
    pusher.disconnect();
  });

  it("should not use any transports if the whitelist is empty", function() {
    var pusher = new Pusher("asdf", {
      disableStats: true,
      enabledTransports: []
    });
    expect(transports.WSTransport.createConnection).not.toHaveBeenCalled();
    expect(transports.XHRStreamingTransport.createConnection).not.toHaveBeenCalled();
    expect(transports.SockJSTransport.createConnection).not.toHaveBeenCalled();
    pusher.disconnect();
  });

  it("should use only transports from the whitelist", function() {
    var pusher = new Pusher("asdf", {
      disableStats: true,
      enabledTransports: ["a", "c"]
    });
    expect(transports.WSTransport.createConnection).toHaveBeenCalled();
    expect(transports.XHRStreamingTransport.createConnection).not.toHaveBeenCalled();
    expect(transports.SockJSTransport.createConnection).toHaveBeenCalled();
    pusher.disconnect();
  });

  it("should not use transports from the blacklist", function() {
    var pusher = new Pusher("asdf", {
      disableStats: true,
      disabledTransports: ["a", "b"]
    });
    expect(transports.WSTransport.createConnection).not.toHaveBeenCalled();
    expect(transports.XHRStreamingTransport.createConnection).not.toHaveBeenCalled();
    expect(transports.SockJSTransport.createConnection).toHaveBeenCalled();
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
    expect(transports.SockJSTransport.createConnection).toHaveBeenCalled();
    pusher.disconnect();
  });
});
