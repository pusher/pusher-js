describe("Default", function() {
  describe("strategy", function() {
    function buildTest(ws, flash) {
      it("should be supported when ws=" + ws + " and flash=" + flash, function() {
        if (ws) {
          spyOn(Pusher.WSTransport, "isSupported").andReturn(true);
        }
        if (flash) {
          spyOn(Pusher.FlashTransport, "isSupported").andReturn(true);
        }
        var strategy = Pusher.StrategyBuilder.build(
          Pusher.getDefaultStrategy(Pusher.getGlobalConfig())
        );
        expect(strategy.isSupported()).toBe(true);
      });
    }

    for (var ws = 0; ws <= 1; ws++) {
      for (var flash = 0; flash <= 1; flash++) {
        buildTest(ws, flash);
      }
    }
  });
});
