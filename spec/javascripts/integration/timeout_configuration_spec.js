describeIntegration("Timeout Configuration", function() {
  var transport;
  var pusher;

  beforeEach(function() {
    spyOn(Pusher.Network, "isOnline").andReturn(true);

    spyOn(Pusher.WSTransport, "isSupported").andReturn(true);
    spyOn(Pusher.FlashTransport, "isSupported").andReturn(false);
    spyOn(Pusher.SockJSTransport, "isSupported").andReturn(false);

    spyOn(Pusher.Util, "getLocalStorage").andReturn({});

    spyOn(Pusher.WSTransport, "createConnection").andCallFake(function() {
      transport = Pusher.Mocks.getTransport(true);
      transport.supportsPing.andReturn(false);
      return transport;
    });
    jasmine.Clock.useMock();
  });

  afterEach(function() {
    pusher.disconnect();
  });

  it("should transition to unavailable after default timeout", function() {
    var onUnavailable = jasmine.createSpy("onUnavailable");

    pusher = new Pusher("foobar");
    pusher.connect();
    pusher.connection.bind("unavailable", onUnavailable);

    jasmine.Clock.tick(Pusher.unavailable_timeout - 1);
    expect(onUnavailable).not.toHaveBeenCalled();
    jasmine.Clock.tick(1);
    expect(onUnavailable).toHaveBeenCalled();
  });

  it("should transition to unavailable after timeout passed as an option", function() {
    var onUnavailable = jasmine.createSpy("onUnavailable");

    pusher = new Pusher("foobar", { unavailable_timeout: 2345 });
    pusher.connect();
    pusher.connection.bind("unavailable", onUnavailable);

    jasmine.Clock.tick(2344);
    expect(onUnavailable).not.toHaveBeenCalled();
    jasmine.Clock.tick(1);
    expect(onUnavailable).toHaveBeenCalled();
  });

  it("should obey default activity and pong timeouts", function() {
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
          socket_id: "123.456"
        }
      })
    });

    expect(pusher.connection.state).toEqual("connected");
    jasmine.Clock.tick(Pusher.activity_timeout - 1);
    expect(firstTransport.send).not.toHaveBeenCalled();
    jasmine.Clock.tick(1);
    expect(firstTransport.send).toHaveBeenCalled();

    jasmine.Clock.tick(Pusher.pong_timeout - 1);
    expect(firstTransport.close).not.toHaveBeenCalled();
    jasmine.Clock.tick(1);
    expect(firstTransport.close).toHaveBeenCalled();
  });

  it("should obey activity and pong timeouts passed as options", function() {
    pusher = new Pusher("foobar", {
      activity_timeout: 11111,
      pong_timeout: 2222
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
          socket_id: "123.456"
        }
      })
    });

    expect(pusher.connection.state).toEqual("connected");
    jasmine.Clock.tick(11110);
    expect(firstTransport.send).not.toHaveBeenCalled();
    jasmine.Clock.tick(1);
    expect(firstTransport.send).toHaveBeenCalled();

    jasmine.Clock.tick(2221);
    expect(firstTransport.close).not.toHaveBeenCalled();
    jasmine.Clock.tick(1);
    expect(firstTransport.close).toHaveBeenCalled();
  });
});
