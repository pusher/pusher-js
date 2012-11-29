describe("StrategyBuilder", function() {
  it("should construct a transport strategy", function() {
    var strategy = Pusher.StrategyBuilder.build(
      { type: "transport",
        transport: "ws",
        option: "value",
      }
    );

    expect(strategy).toEqual(jasmine.any(Pusher.TransportStrategy));
    expect(strategy.transport).toBe(Pusher.WSTransport);
    expect(strategy.options).toEqual({
      option: "value"
    });
  });

  it("should construct a delayed strategy", function() {
    var strategy = Pusher.StrategyBuilder.build(
      { type: "delayed",
        child: {
          type: "transport",
          transport: "ws",
          option: "value",
        },
        delay: 2000,
      }
    );

    expect(strategy).toEqual(jasmine.any(Pusher.DelayedStrategy));
    expect(strategy.substrategy).toEqual(jasmine.any(Pusher.TransportStrategy));

    expect(strategy.options).toEqual({
      delay: 2000,
    });
    expect(strategy.substrategy.options).toEqual({
      option: "value",
      delay: 2000,
    });
  });

  it("should construct a sequential strategy", function() {
    var strategy = Pusher.StrategyBuilder.build(
      { type: "sequential",
        children: [
          { type: "transport",
            transport: "ws",
          },
          { type: "transport",
            transport: "sockjs",
            host: "sockjs.pusher.com",
          },
        ],
        host: "ws.pusherapp.com",
        loop: true,
        timeout: 2000,
        timeoutLimit: 8000,
      }
    );

    expect(strategy).toEqual(jasmine.any(Pusher.SequentialStrategy));
    expect(strategy.substrategies[0])
      .toEqual(jasmine.any(Pusher.TransportStrategy));
    expect(strategy.substrategies[0].transport).toBe(Pusher.WSTransport);
    expect(strategy.substrategies[1])
      .toEqual(jasmine.any(Pusher.TransportStrategy));
    expect(strategy.substrategies[1].transport).toBe(Pusher.SockJSTransport);

    expect(strategy.options).toEqual({
      host: "ws.pusherapp.com",
      loop: true,
      timeout: 2000,
      timeoutLimit: 8000,
    });
    expect(strategy.substrategies[0].options).toEqual({
      host: "ws.pusherapp.com",
      loop: true,
      timeout: 2000,
      timeoutLimit: 8000,
    });
    expect(strategy.substrategies[1].options).toEqual({
      host: "sockjs.pusher.com",
      loop: true,
      timeout: 2000,
      timeoutLimit: 8000,
    });
  });

  it("should construct a first supported strategy", function() {
    var strategy = Pusher.StrategyBuilder.build(
      { type: "first_supported",
        children: [
          { type: "transport", transport: "ws" },
          { type: "transport", transport: "flash" },
          { type: "transport", transport: "sockjs" },
        ],
      }
    );
    expect(strategy).toEqual(jasmine.any(Pusher.FirstSupportedStrategy));
  });

  it("should construct a first connected strategy", function() {
    var strategy = Pusher.StrategyBuilder.build(
      { type: "first_connected",
        children: [
          { type: "transport", transport: "ws" },
          { type: "transport", transport: "flash" },
        ],
      }
    );
    expect(strategy).toEqual(jasmine.any(Pusher.FirstConnectedStrategy));
  });

  it("should construct a first connected ever strategy", function() {
    var strategy = Pusher.StrategyBuilder.build(
      { type: "first_connected_ever",
        children: [
          { type: "transport", transport: "ws" },
          { type: "transport", transport: "flash" },
        ],
      }
    );
    expect(strategy).toEqual(jasmine.any(Pusher.FirstConnectedEverStrategy));
  });
});
