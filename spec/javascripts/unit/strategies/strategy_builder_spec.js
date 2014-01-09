describe("StrategyBuilder", function() {
  it("should construct a transport strategy", function() {
    var strategy = Pusher.StrategyBuilder.build([
      [":def_transport", "test", "sockjs", 1, { option: "value" }],
      [":def", "strategy", ":test"]
    ]);

    expect(strategy).toEqual(jasmine.any(Pusher.TransportStrategy));
    expect(strategy.transport).toBe(Pusher.SockJSTransport);
    expect(strategy.options).toEqual({
      option: "value"
    });
  });

  it("should construct a delayed strategy", function() {
    var strategy = Pusher.StrategyBuilder.build([
      [":def_transport", "test", "sockjs", 1, { option: "value" }],
      [":def", "strategy", [":delayed", 2000, ":test"]]
    ]);

    expect(strategy).toEqual(jasmine.any(Pusher.DelayedStrategy));
    expect(strategy.strategy).toEqual(jasmine.any(Pusher.TransportStrategy));
    expect(strategy.options.delay).toEqual(2000);
  });

  it("should construct a sequential strategy", function() {
    spyOn(Pusher.WSTransport, "isSupported").andReturn(true);

    var strategy = Pusher.StrategyBuilder.build([
      [":def_transport", "one", "ws", 1, { option: "1" }],
      [":def_transport", "two", "sockjs", 1, { option: "2" }],
      [":def", "timeouts", { loop: true, timeout: 2000, timeoutLimit: 8000}],
      [":def", "strategy", [":sequential", ":timeouts", ":one", ":two"]]
    ]);

    expect(strategy).toEqual(jasmine.any(Pusher.SequentialStrategy));
    expect(strategy.strategies[0])
      .toEqual(jasmine.any(Pusher.TransportStrategy));
    expect(strategy.strategies[0].transport).toBe(Pusher.WSTransport);

    expect(strategy.strategies[1])
      .toEqual(jasmine.any(Pusher.TransportStrategy));
    expect(strategy.strategies[1].transport).toBe(Pusher.SockJSTransport);

    expect(strategy.loop).toBe(true);
    expect(strategy.timeout).toEqual(2000);
    expect(strategy.timeoutLimit).toEqual(8000);
  });

  it("should construct a cached strategy", function() {
    var strategy = Pusher.StrategyBuilder.build([
      [":def_transport", "sub", "flash", 2, { disableFlash: true }],
      [":def", "strategy", [":cached", 1234, ":sub"]]
    ], { encrypted: true });
    expect(strategy).toEqual(jasmine.any(Pusher.CachedStrategy));
    expect(strategy.ttl).toEqual(1234);
    expect(strategy.encrypted).toEqual(true);
  });

  it("should construct a first connected strategy", function() {
    var strategy = Pusher.StrategyBuilder.build([
      [":def_transport", "sub", "flash", 2, { disableFlash: true }],
      [":def", "strategy", [":first_connected", ":sub"]]
    ]);
    expect(strategy).toEqual(jasmine.any(Pusher.FirstConnectedStrategy));
  });

  it("should construct a best connected ever strategy", function() {
    var strategy = Pusher.StrategyBuilder.build([
      [":def_transport", "one", "ws", 1, {}],
      [":def_transport", "two", "flash", 2, {}],
      [":def_transport", "three", "sockjs", 3, {}],
      [":def", "strategy", [":best_connected_ever", ":one", ":two", ":three"]]
    ]);
    expect(strategy).toEqual(jasmine.any(Pusher.BestConnectedEverStrategy));
  });

  it("should construct an if strategy with isSupported call", function() {
    var strategy = Pusher.StrategyBuilder.build([
      [":def_transport", "ws", "ws", 1, {}],
      [":def_transport", "sockjs", "sockjs", 2, {}],
      [":def", "strategy",
        [":if", [":is_supported", ":ws"], [
          ":ws"
        ], [
          ":sockjs"
        ]]
      ]
    ]);
    expect(strategy).toEqual(jasmine.any(Pusher.IfStrategy));
  });

  it("should throw an error on unsupported transport", function() {
    expect(function() {
      Pusher.StrategyBuilder.build([
        [":def_transport", "one", "fake", 1]
      ]);
    }).toThrow(jasmine.any(Pusher.Errors.UnsupportedTransport));
  });


  it("should throw an error on unsupported strategy", function() {
    expect(function() {
      Pusher.StrategyBuilder.build([
        [":def_transport", "one", "ws", 1, {}],
        [":def", "strategy", [":wut", ":one"]]
      ]);
    }).toThrow("Calling non-function :wut");
  });
});
