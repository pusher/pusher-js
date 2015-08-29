describe("Default", function() {
  describe("strategy", function() {
    function buildTest(ws) {
      it("should be supported when ws=" + ws, function() {
        if (ws) {
          spyOn(Pusher.WSTransport, "isSupported").andReturn(true);
        }
        var strategy = Pusher.StrategyBuilder.build(
          Pusher.getDefaultStrategy(Pusher.getGlobalConfig())
        );
        expect(strategy.isSupported()).toBe(true);
      });
    }

    for (var ws = 0; ws <= 1; ws++) {
      buildTest(ws);
    }
  });
});
