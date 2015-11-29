var WSTransport = require('transports/transports').WSTransport;
var StrategyBuilder = require('strategies/strategy_builder');
var Defaults = require('defaults');
var DefaultConfig = require('config');

describe("Default", function() {
  describe("strategy", function() {
    function buildTest(ws) {
      it("should be supported when ws=" + ws, function() {
        if (ws) {
          spyOn(WSTransport, "isSupported").andReturn(true);
        }
        var strategy = StrategyBuilder.build(
          Defaults.getDefaultStrategy(DefaultConfig.getGlobalConfig())
        );
        expect(strategy.isSupported()).toBe(true);
      });
    }

    for (var ws = 0; ws <= 1; ws++) {
      buildTest(ws);
    }
  });
});
