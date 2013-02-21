describe("StrategyBuilder", function() {
  it("should construct a transport strategy", function() {
    var strategy = Pusher.StrategyBuilder.build(
      { type: "transport",
        transport: "sockjs",
        option: "value"
      }
    );

    expect(strategy).toEqual(jasmine.any(Pusher.TransportStrategy));
    expect(strategy.transport).toBe(Pusher.SockJSTransport);
    expect(strategy.options).toEqual({
      option: "value"
    });
  });

  it("should construct a delayed strategy", function() {
    var strategy = Pusher.StrategyBuilder.build(
      { type: "delayed",
        child: {
          type: "transport",
          transport: "sockjs",
          option: "value"
        },
        delay: 2000
      }
    );

    expect(strategy).toEqual(jasmine.any(Pusher.DelayedStrategy));
    expect(strategy.strategies[0]).toEqual(jasmine.any(Pusher.TransportStrategy));

    expect(strategy.options.delay).toEqual(2000);
    expect(strategy.strategies[0].options).toEqual({
      option: "value",
      delay: 2000
    });
  });

  it("should construct a sequential strategy", function() {
    spyOn(Pusher.WSTransport, "isSupported").andReturn(true);

    var strategy = Pusher.StrategyBuilder.build(
      { type: "sequential",
        children: [
          { type: "transport",
            transport: "ws"
          },
          { type: "transport",
            transport: "sockjs",
            host: "sockjs.pusher.com"
          }
        ],
        host: "ws.pusherapp.com",
        loop: true,
        timeout: 2000,
        timeoutLimit: 8000
      }
    );

    expect(strategy).toEqual(jasmine.any(Pusher.SequentialStrategy));
    expect(strategy.strategies[0])
      .toEqual(jasmine.any(Pusher.TransportStrategy));

    expect(strategy.strategies[0].transport).toBe(Pusher.WSTransport);
    expect(strategy.strategies[1])
      .toEqual(jasmine.any(Pusher.TransportStrategy));
    expect(strategy.strategies[1].transport).toBe(Pusher.SockJSTransport);

    expect(strategy.options.loop).toBe(true);
    expect(strategy.options.timeout).toEqual(2000);
    expect(strategy.options.timeoutLimit).toEqual(8000);

    expect(strategy.strategies[0].options).toEqual({
      host: "ws.pusherapp.com",
      loop: true,
      timeout: 2000,
      timeoutLimit: 8000
    });
    expect(strategy.strategies[1].options).toEqual({
      host: "sockjs.pusher.com",
      loop: true,
      timeout: 2000,
      timeoutLimit: 8000
    });
  });

  it("should construct a first supported strategy", function() {
    var strategy = Pusher.StrategyBuilder.build(
      { type: "first_supported",
        children: [
          { type: "transport", transport: "sockjs" }
        ]
      }
    );
    expect(strategy).toEqual(jasmine.any(Pusher.FirstSupportedStrategy));
  });

  it("should construct an all supported strategy", function() {
    var strategy = Pusher.StrategyBuilder.build(
      { type: "all_supported",
        children: [
          { type: "transport", transport: "sockjs" }
        ]
      }
    );
    expect(strategy).toEqual(jasmine.any(Pusher.AllSupportedStrategy));
  });

  it("should construct a first connected strategy", function() {
    var strategy = Pusher.StrategyBuilder.build(
      { type: "first_connected",
        children: [
          { type: "transport", transport: "sockjs" }
        ]
      }
    );
    expect(strategy).toEqual(jasmine.any(Pusher.FirstConnectedStrategy));
  });

  it("should construct a first connected ever strategy", function() {
    var strategy = Pusher.StrategyBuilder.build(
      { type: "best_connected_ever",
        children: [
          { type: "transport", transport: "sockjs" }
        ]
      }
    );
    expect(strategy).toEqual(jasmine.any(Pusher.BestConnectedEverStrategy));
  });

  it("should throw an error on unsupported transport", function() {
    expect(function() {
      Pusher.StrategyBuilder.build(
        { type: "transport", transport: "fake" }
      );
    }).toThrow(jasmine.any(Pusher.Errors.UnsupportedTransport));
  });


  it("should throw an error on unsupported strategy", function() {
    expect(function() {
      Pusher.StrategyBuilder.build(
        { type: "fake" }
      );
    }).toThrow(jasmine.any(Pusher.Errors.UnsupportedStrategy));
  });
});
