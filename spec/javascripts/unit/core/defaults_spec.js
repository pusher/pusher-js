var WSTransport = require('runtime').default.Transports.ws;
var StrategyBuilder = require('core/strategies/strategy_builder');
var Runtime = require('runtime').default;
var Config = require('core/config');

describe("Default", function() {
  describe("strategy", function() {
    function buildTest(ws) {
      it("should be supported when ws=" + ws, function() {
        if (ws) {
          spyOn(WSTransport, "isSupported").and.returnValue(true);
        }
        var strategy = Runtime.getDefaultStrategy(
          Config.getConfig({}),
          {},
          StrategyBuilder.defineTransport,
        );
        expect(strategy.isSupported()).toBe(true);
      });
    }

    for (var ws = 0; ws <= 1; ws++) {
      buildTest(ws);
    }
  });
});
