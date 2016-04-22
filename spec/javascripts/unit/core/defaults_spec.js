var WSTransport = require('runtime').default.Transports.ws;
var StrategyBuilder = require('core/strategies/strategy_builder');
var Runtime = require('runtime').default;
var DefaultConfig = require('core/config');

describe("Default", function() {
  describe("strategy", function() {
    function buildTest(ws) {
      it("should be supported when ws=" + ws, function() {
        if (ws) {
          spyOn(WSTransport, "isSupported").andReturn(true);
        }
        var strategy = StrategyBuilder.build(
          Runtime.getDefaultStrategy(DefaultConfig.getGlobalConfig())
        );
        expect(strategy.isSupported()).toBe(true);
      });
    }

    for (var ws = 0; ws <= 1; ws++) {
      buildTest(ws);
    }
  });
});
