describe("Transport lists", function() {
  var _isReady = Pusher.isReady;

  beforeEach(function() {
    spyOn(Pusher.WSTransport, "isSupported").andReturn(true);
    spyOn(Pusher.FlashTransport, "isSupported").andReturn(true);
    spyOn(Pusher.SockJSTransport, "isSupported").andReturn(true);

    spyOn(Pusher.WSTransport, "createConnection")
      .andCallFake(Pusher.Mocks.getTransport);
    spyOn(Pusher.FlashTransport, "createConnection")
      .andCallFake(Pusher.Mocks.getTransport);
    spyOn(Pusher.SockJSTransport, "createConnection")
      .andCallFake(Pusher.Mocks.getTransport);

    spyOn(Pusher, "getDefaultStrategy").andCallFake(function() {
      return [
        [":def_transport", "a", "ws", 1, {}],
        [":def_transport", "b", "flash", 2, {}],
        [":def_transport", "c", "sockjs", 3, {}],
        [":def", "strategy", [":best_connected_ever", ":a", ":b", ":c"]]
      ];
    });

    spyOn(Pusher.Network, "isOnline").andReturn(true);
    Pusher.isReady = true;
  });

  afterEach(function() {
    Pusher.isReady = _isReady;
  });

  it("should use all transports if the whitelist is not specified", function() {
    var pusher = new Pusher("asdf", { disableStats: true });
    expect(Pusher.WSTransport.createConnection).toHaveBeenCalled();
    expect(Pusher.FlashTransport.createConnection).toHaveBeenCalled();
    expect(Pusher.SockJSTransport.createConnection).toHaveBeenCalled();
    pusher.disconnect();
  });

  it("should not use any transports if the whitelist is empty", function() {
    var pusher = new Pusher("asdf", {
      disableStats: true,
      enabledTransports: []
    });
    expect(Pusher.WSTransport.createConnection).not.toHaveBeenCalled();
    expect(Pusher.FlashTransport.createConnection).not.toHaveBeenCalled();
    expect(Pusher.SockJSTransport.createConnection).not.toHaveBeenCalled();
    pusher.disconnect();
  });

  it("should use only transports from the whitelist", function() {
    var pusher = new Pusher("asdf", {
      disableStats: true,
      enabledTransports: ["a", "c"]
    });
    expect(Pusher.WSTransport.createConnection).toHaveBeenCalled();
    expect(Pusher.FlashTransport.createConnection).not.toHaveBeenCalled();
    expect(Pusher.SockJSTransport.createConnection).toHaveBeenCalled();
    pusher.disconnect();
  });

  it("should not use transports from the blacklist", function() {
    var pusher = new Pusher("asdf", {
      disableStats: true,
      disabledTransports: ["a", "b"]
    });
    expect(Pusher.WSTransport.createConnection).not.toHaveBeenCalled();
    expect(Pusher.FlashTransport.createConnection).not.toHaveBeenCalled();
    expect(Pusher.SockJSTransport.createConnection).toHaveBeenCalled();
    pusher.disconnect();
  });

  it("should not use transports from the blacklist, even if they are on the whitelist", function() {
    var pusher = new Pusher("asdf", {
      disableStats: true,
      enabledTransports: ["b", "c"],
      disabledTransports: ["b"]
    });
    expect(Pusher.WSTransport.createConnection).not.toHaveBeenCalled();
    expect(Pusher.FlashTransport.createConnection).not.toHaveBeenCalled();
    expect(Pusher.SockJSTransport.createConnection).toHaveBeenCalled();
    pusher.disconnect();
  });
});
