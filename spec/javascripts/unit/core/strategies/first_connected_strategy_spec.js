var Mocks = require("mocks");
var FirstConnectedStrategy = require('core/strategies/first_connected_strategy').default;

describe("FirstConnectedStrategy", function() {
  var substrategy;
  var callback;
  var strategy;

  beforeEach(function() {
    substrategy = Mocks.getStrategy(true);
    strategy = new FirstConnectedStrategy(substrategy);
    state = {};

    callback = jasmine.createSpy();
  });

  describe("after calling isSupported", function() {
    it("should return true when the substrategy is supported", function() {
      var substrategy = Mocks.getStrategy(true);
      var strategy = new FirstConnectedStrategy(substrategy);
      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false when the substrategy is not supported", function() {
      var substrategy = Mocks.getStrategy(false);
      var strategy = new FirstConnectedStrategy(substrategy);
      expect(strategy.isSupported()).toBe(false);
    });
  });

  describe("on connect", function() {
    it("should succeed on first connection and abort the substrategy", function() {
      strategy.connect(0, callback);

      expect(substrategy.connect)
        .toHaveBeenCalledWith(0, jasmine.any(Function));

      var handshake = {};
      substrategy._callback(null, handshake);

      expect(callback).toHaveBeenCalledWith(null, handshake);
      expect(substrategy._abort).toHaveBeenCalled();
    });

    it("should pass an error when the substrategy fails", function() {
      strategy.connect(0, callback);

      substrategy._callback(true);
      expect(callback).toHaveBeenCalledWith(true, undefined);
    });
  });

  describe("on abort", function() {
    it("should abort the substrategy", function() {
      var runner = strategy.connect(0);
      runner.abort();
      expect(substrategy._abort).toHaveBeenCalled();
    });
  });

  describe("on forceMinPriority", function() {
    it("should force the priority on the substrategy", function() {
      var runner = strategy.connect(0, this.callback);
      runner.forceMinPriority(5);
      expect(substrategy._forceMinPriority).toHaveBeenCalledWith(5);
    });
  });
});
