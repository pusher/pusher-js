describe("Pusher (integration)", function() {
  var pusher, transport;

  beforeEach(function() {
    function createConnection() {
      transport = Pusher.Mocks.getTransport(true);
      return transport;
    }

    spyOn(Pusher.Network, "isOnline").andReturn(true);

    spyOn(Pusher.WSTransport, "isSupported").andReturn(true);
    spyOn(Pusher.FlashTransport, "isSupported").andReturn(false);
    spyOn(Pusher.SockJSTransport, "isSupported").andReturn(true);

    spyOn(Pusher.WSTransport, "createConnection").andCallFake(createConnection);
    spyOn(Pusher.FlashTransport, "createConnection").andCallFake(createConnection);
    spyOn(Pusher.SockJSTransport, "createConnection").andCallFake(createConnection);

    pusher = new Pusher("foobar");
  });

  afterEach(function() {
    pusher.disconnect();
  });

  it("should fall back to SockJS after two broken connections", function() {
    runs(function() {
      pusher.connect();
    });
    waitsFor(function() {
      return Pusher.WSTransport.createConnection.calls.length === 1;
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
      new Pusher.Timer(100, function() {
        transport.emit("closed", {
          code: 1006,
          reason: "KABOOM!",
          wasClean: false
        });
      });
    });
    waitsFor(function() {
      return Pusher.WSTransport.createConnection.calls.length === 2;
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
      new Pusher.Timer(100, function() {
        transport.emit("closed", {
          code: 1006,
          reason: "KABOOM! AGAIN!",
          wasClean: false
        });
      });
    });
    waitsFor(function() {
      return Pusher.SockJSTransport.createConnection.calls.length === 1;
    }, "SockJS connection to be created", 1500);
    runs(function() {
      expect(Pusher.WSTransport.createConnection.calls.length).toEqual(2);
    });
  });
});
