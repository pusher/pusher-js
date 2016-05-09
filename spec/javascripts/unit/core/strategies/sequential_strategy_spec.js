var Mocks = require("mocks");
var SequentialStrategy = require('core/strategies/sequential_strategy').default;

describe("SequentialStrategy", function() {
  beforeEach(function() {
    this.callback = jasmine.createSpy();
    this.substrategies = Mocks.getStrategies([true, true]);
    this.strategy = new SequentialStrategy(this.substrategies, {});

    jasmine.Clock.useMock();
  });

  describe("after calling isSupported", function() {
    it("should return true when one of substrategies is supported", function() {
      var substrategies = Mocks.getStrategies([false, true]);
      var strategy = new SequentialStrategy(substrategies, {});
      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false when none of substrategies are supported", function() {
      var substrategies = Mocks.getStrategies([false, false]);
      var strategy = new SequentialStrategy(substrategies, {});
      expect(strategy.isSupported()).toBe(false);
    });
  });

  describe("on connect", function() {
    it("should finish on first successful substrategy", function() {
      this.strategy.connect(0, this.callback);

      expect(this.substrategies[0].connect).toHaveBeenCalled();
      expect(this.substrategies[1].connect).not.toHaveBeenCalled();

      var handshake = {};
      this.substrategies[0]._callback(null, handshake);

      expect(this.callback).toHaveBeenCalledWith(null, handshake);
      expect(this.substrategies[0]._abort).not.toHaveBeenCalled();
      expect(this.substrategies[1].connect).not.toHaveBeenCalled();
    });

    it("should fail after trying all supported substrategies", function() {
      this.strategy.connect(0, this.callback);

      expect(this.substrategies[0].connect).toHaveBeenCalled();
      expect(this.substrategies[1].connect).not.toHaveBeenCalled();

      this.substrategies[0]._callback(true);
      expect(this.substrategies[1].connect).toHaveBeenCalled();

      this.substrategies[1]._callback(true);
      expect(this.substrategies[1]._abort).not.toHaveBeenCalled();
      expect(this.callback).toHaveBeenCalledWith(true);
      expect(this.callback.calls.length).toEqual(1);
    });

    it("should support looping", function() {
      var strategy = new SequentialStrategy(this.substrategies, {
        loop: true
      });
      var runner = strategy.connect(0, this.callback);

      expect(this.substrategies[0].connect.calls.length).toEqual(1);
      expect(this.substrategies[1].connect.calls.length).toEqual(0);

      this.substrategies[0]._callback(true);

      expect(this.substrategies[0].connect.calls.length).toEqual(1);
      expect(this.substrategies[1].connect.calls.length).toEqual(1);

      this.substrategies[1]._callback(true);

      expect(this.substrategies[0].connect.calls.length).toEqual(2);
      expect(this.substrategies[1].connect.calls.length).toEqual(1);

      runner.abort();
      expect(this.substrategies[0]._abort).toHaveBeenCalled();
    });
  });

  describe("on abort", function() {
    it("should send abort to first tried substrategy", function() {
      var runner = this.strategy.connect(0, this.callback);

      expect(this.substrategies[0].connect).toHaveBeenCalled();
      expect(this.substrategies[1].connect).not.toHaveBeenCalled();

      runner.abort();

      expect(this.substrategies[0]._abort).toHaveBeenCalled();
      expect(this.substrategies[1].connect).not.toHaveBeenCalled();
    });

    it("should send abort to second tried substrategy", function() {
      var runner = this.strategy.connect(0, this.callback);

      this.substrategies[0]._callback(true);
      expect(this.substrategies[1].connect).toHaveBeenCalled();

      runner.abort();
      expect(this.substrategies[1]._abort).toHaveBeenCalled();
    });

    it("should stop retrying with timeouts", function() {
      var strategy = new SequentialStrategy(this.substrategies, {
        timeout: 100
      });
      var runner = strategy.connect(0, this.callback);

      expect(this.substrategies[0].connect).toHaveBeenCalled();
      expect(this.substrategies[1].connect).not.toHaveBeenCalled();

      runner.abort();
      jasmine.Clock.tick(100);
      expect(this.substrategies[1].connect).not.toHaveBeenCalled();
    });
  });

  describe("on error", function() {
    it("should wait for the timeout before calling back", function() {
      var substrategy = Mocks.getStrategy(true);
      var strategy = new SequentialStrategy([substrategy], {
        timeout: 100
      });

      strategy.connect(0, this.callback);
      substrategy._callback(true);

      jasmine.Clock.tick(99);
      expect(this.callback).not.toHaveBeenCalled();
      jasmine.Clock.tick(1);
      expect(this.callback).toHaveBeenCalled();
    });

    it("should not wait for the timeout before calling back if failFast is on", function() {
      var substrategy = Mocks.getStrategy(true);
      var strategy = new SequentialStrategy([substrategy], {
        timeout: 100,
        failFast: true
      });

      strategy.connect(0, this.callback);
      substrategy._callback(true);
      expect(this.callback).toHaveBeenCalled();
    });
  });

  describe("on timeout", function() {
    it("should try substrategies with exponential timeouts", function() {
      var substrategies = Mocks.getStrategies(
        [true, true, true, true, true]
      );
      var strategy = new SequentialStrategy(substrategies, {
        timeout: 100,
        timeoutLimit: 400
      });

      strategy.connect(0, this.callback);

      expect(substrategies[0].connect).toHaveBeenCalled();
      expect(substrategies[1].connect).not.toHaveBeenCalled();

      jasmine.Clock.tick(99);
      expect(substrategies[1].connect).not.toHaveBeenCalled();

      jasmine.Clock.tick(1);
      expect(substrategies[1].connect).toHaveBeenCalled();
      expect(substrategies[2].connect).not.toHaveBeenCalled();

      jasmine.Clock.tick(199);
      expect(substrategies[2].connect).not.toHaveBeenCalled();

      jasmine.Clock.tick(1);
      expect(substrategies[2].connect).toHaveBeenCalled();
      expect(substrategies[3].connect).not.toHaveBeenCalled();

      jasmine.Clock.tick(399);
      expect(substrategies[3].connect).not.toHaveBeenCalled();

      jasmine.Clock.tick(1);
      expect(substrategies[3].connect).toHaveBeenCalled();
      expect(substrategies[4].connect).not.toHaveBeenCalled();

      jasmine.Clock.tick(399);
      expect(substrategies[4].connect).not.toHaveBeenCalled();

      jasmine.Clock.tick(1);
      expect(substrategies[4].connect).toHaveBeenCalled();
    });
  });

  describe("on forceMinPriority", function() {
    it("should force the priority on the running substrategy", function() {
      var runner = this.strategy.connect(0, this.callback);
      runner.forceMinPriority(5);
      expect(this.substrategies[0]._forceMinPriority).toHaveBeenCalledWith(5);
    });

    it("should keep connecting with the new priority", function() {
      var runner = this.strategy.connect(0, this.callback);
      runner.forceMinPriority(5);

      this.substrategies[0]._callback(true);
      expect(this.substrategies[1].connect)
        .toHaveBeenCalledWith(5, jasmine.any(Function));
    });
  });
});
