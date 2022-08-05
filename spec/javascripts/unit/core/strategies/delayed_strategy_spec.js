var Mocks = require("mocks");
var DelayedStrategy = require('core/strategies/delayed_strategy').default;

describe("DelayedStrategy", function() {
  beforeEach(function() {
    this.substrategy = Mocks.getStrategy(true);
    this.strategy = new DelayedStrategy(this.substrategy, { delay: 0 });
    this.callback = jasmine.createSpy();

    jasmine.clock().uninstall();
    jasmine.clock().install();
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  describe("after calling isSupported", function() {
    it("should return true if substrategy is supported", function() {
      var substrategy = Mocks.getStrategy(true);
      var strategy = new DelayedStrategy(substrategy, {});
      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false if substrategy is not supported", function() {
      var substrategy = Mocks.getStrategy(false);
      var strategy = new DelayedStrategy(substrategy, {});
      expect(strategy.isSupported()).toBe(false);
    });
  });

  describe("on connect", function() {
    it("should connect to substrategy after a delay", function() {
      var strategy = new DelayedStrategy(this.substrategy, {
        delay: 100
      });

      strategy.connect(0, this.callback);

      expect(this.substrategy.connect).not.toHaveBeenCalled();
      jasmine.clock().tick(99);
      expect(this.substrategy.connect).not.toHaveBeenCalled();
      jasmine.clock().tick(1);
      expect(this.substrategy.connect).toHaveBeenCalled();

      var handshake = {};
      this.substrategy._callback(null, handshake);

      expect(this.callback).toHaveBeenCalledWith(null, handshake);
    });

    it("should pass an error when substrategy fails", function() {
      this.strategy.connect(0, this.callback);
      jasmine.clock().tick(0);
      this.substrategy._callback(true);

      expect(this.callback).toHaveBeenCalledWith(true);
    });
  });

  describe("on abort", function() {
    it("should abort substrategy when connecting", function() {
      var runner = this.strategy.connect(0);
      jasmine.clock().tick(0);
      runner.abort();
      expect(this.substrategy._abort).toHaveBeenCalled();
    });

    it("should clear the timer and not abort substrategy when waiting", function() {
      var run = this.strategy.connect(0);
      expect(this.substrategy.connect).not.toHaveBeenCalled();
      run.abort();
      jasmine.clock().tick(10000);
      expect(this.substrategy._abort).not.toHaveBeenCalled();
      expect(this.substrategy.connect).not.toHaveBeenCalled();
    });
  });

  describe("on forceMinPriority", function() {
    it("should force the priority while waiting", function() {
      var runner = this.strategy.connect(0, this.callback);
      runner.forceMinPriority(5);
      jasmine.clock().tick(0);
      expect(this.substrategy.connect)
        .toHaveBeenCalledWith(5, jasmine.any(Function));
    });

    it("should force the priority while connecting", function() {
      var runner = this.strategy.connect(0, this.callback);
      jasmine.clock().tick(0);
      runner.forceMinPriority(5);
      expect(this.substrategy._forceMinPriority).toHaveBeenCalledWith(5);
    });
  });
});
