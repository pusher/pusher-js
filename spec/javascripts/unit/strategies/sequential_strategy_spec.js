describe("SequentialStrategy", function() {
  function getSubstrategyMock(supported) {
    var substrategy = new Pusher.EventsDispatcher();

    substrategy.initialize = jasmine.createSpy("initialize");
    substrategy.connect = jasmine.createSpy("connect");
    substrategy.abort = jasmine.createSpy("abort");
    substrategy.isSupported = jasmine.createSpy("initialize")
      .andReturn(supported);

    return substrategy;
  }

  it("should expose its name", function() {
    expect(new Pusher.SequentialStrategy([]).name).toEqual("seq");
  });

  describe("when asked if it's supported", function() {
    it("should return true when one of substrategies is supported", function() {
      var substrategies = [
        getSubstrategyMock(false),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies);

      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false when none of substrategies is supported", function() {
      var substrategies = [
        getSubstrategyMock(false),
        getSubstrategyMock(false)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies);

      expect(strategy.isSupported()).toBe(false);
    });
  });

  describe("on initialization", function() {
    it("should delegate initialization to all substrategies immediately", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(false),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies);

      strategy.initialize();

      expect(substrategies[0].initialize).toHaveBeenCalled();
      expect(substrategies[1].initialize).not.toHaveBeenCalled();
      expect(substrategies[2].initialize).toHaveBeenCalled();
    });
  });

  describe("on connection attempt", function() {
    it("should finish on first successful substrategy", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies);

      var openCallback = jasmine.createSpy("openCallback");
      strategy.bind("open", openCallback);

      strategy.connect();

      expect(substrategies[0].connect).toHaveBeenCalled();
      expect(substrategies[0].abort).not.toHaveBeenCalled();
      expect(substrategies[1].connect).not.toHaveBeenCalled();

      var connection = {};
      substrategies[0].emit("open", connection);

      expect(openCallback).toHaveBeenCalledWith(connection);
      expect(substrategies[0].abort).not.toHaveBeenCalled();
      expect(substrategies[1].connect).not.toHaveBeenCalled();
    });

    it("should fail after trying all supported substrategies", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(false),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies);

      var errorCallback = jasmine.createSpy("errorCallback");
      strategy.bind("error", errorCallback);

      strategy.connect();

      expect(substrategies[0].connect).toHaveBeenCalled();
      expect(substrategies[1].connect).not.toHaveBeenCalled();

      substrategies[0].emit("error", 1);

      expect(substrategies[0].abort).not.toHaveBeenCalled();
      expect(substrategies[1].connect).not.toHaveBeenCalled();
      expect(substrategies[1].abort).not.toHaveBeenCalled();
      expect(substrategies[2].connect).toHaveBeenCalled();

      expect(errorCallback).not.toHaveBeenCalled();

      substrategies[2].emit("error", 2);

      expect(substrategies[2].abort).not.toHaveBeenCalled();
      expect(errorCallback).toHaveBeenCalled();
    });

    it("should support looping", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies, {
        loop: true
      });

      strategy.connect();

      expect(substrategies[0].connect.calls.length).toEqual(1);
      expect(substrategies[1].connect.calls.length).toEqual(0);

      substrategies[0].emit("error", 1);

      expect(substrategies[0].connect.calls.length).toEqual(1);
      expect(substrategies[1].connect.calls.length).toEqual(1);

      substrategies[1].emit("error", 2);

      expect(substrategies[0].connect.calls.length).toEqual(2);
      expect(substrategies[1].connect.calls.length).toEqual(1);

      strategy.abort();
      expect(substrategies[0].abort.calls.length).toEqual(1);
    });

    it("should allow one attempt at once", function() {
      var substrategies = [
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies);

      expect(strategy.connect()).toBe(true);
      expect(substrategies[0].connect.calls.length).toEqual(1);

      expect(strategy.connect()).toBe(false);
      expect(substrategies[0].connect.calls.length).toEqual(1);
    });

    it("should allow reinitialization and reconnection", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies, {
        loop: true
      });

      strategy.initialize();
      expect(substrategies[0].initialize.calls.length).toEqual(1);
      expect(substrategies[1].initialize.calls.length).toEqual(1);

      strategy.connect();
      expect(substrategies[0].connect.calls.length).toEqual(1);
      expect(substrategies[1].connect.calls.length).toEqual(0);
      expect(substrategies[0].initialize.calls.length).toEqual(2);
      expect(substrategies[1].initialize.calls.length).toEqual(1);

      substrategies[0].emit("open", {});
      expect(substrategies[0].connect.calls.length).toEqual(1);

      strategy.initialize();
      expect(substrategies[0].initialize.calls.length).toEqual(3);
      expect(substrategies[1].initialize.calls.length).toEqual(2);

      strategy.connect();
      expect(substrategies[0].connect.calls.length).toEqual(2);
      expect(substrategies[1].connect.calls.length).toEqual(0);
      expect(substrategies[0].initialize.calls.length).toEqual(4);
      expect(substrategies[1].initialize.calls.length).toEqual(2);
    });
  });

  describe("on aborting", function() {
    it("should send abort to substrategy and not try another one", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies, {});

      strategy.connect();

      expect(substrategies[0].connect).toHaveBeenCalled();
      expect(substrategies[1].connect).not.toHaveBeenCalled();

      strategy.abort();

      expect(substrategies[0].abort).toHaveBeenCalled();
      expect(substrategies[1].connect).not.toHaveBeenCalled();
    });

    it("should send abort to second substrategy", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies, {});

      strategy.connect();
      substrategies[0].emit("error", 666);

      expect(substrategies[1].connect).toHaveBeenCalled();

      strategy.abort();

      expect(substrategies[1].abort).toHaveBeenCalled();
    });

    it("should not abort when there is no attempt being made", function() {
      var substrategies = [
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies);

      expect(strategy.abort()).toBe(false);
      expect(substrategies[0].connect.calls.length).toEqual(0);
      expect(substrategies[0].abort.calls.length).toEqual(0);
    });
  });

  describe("on timeout", function() {
    it("should advance to next substrategy if possible", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies, { timeout: 100 });

      var testStartTimestamp = Pusher.Util.now();
      var nextStrategyDelay = null;

      runs(function() {
        strategy.connect();
      });
      waitsFor(function() {
        nextStrategyDelay = Pusher.Util.now() - testStartTimestamp;
        return substrategies[1].connect.wasCalled;
      }, "error callback to be called", 190);
      runs(function() {
        expect(nextStrategyDelay).toBeGreaterThan(99);
      });
    });

    it("should increase timeout exponentially until the limit", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true),
        getSubstrategyMock(true),
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies, {
        timeout: 100,
        timeoutLimit: 400
      });

      strategy.connect();

      var substrategyStartTimestamp = null;
      var substrategyDelay = null;

      runs(function() {
        substrategyStartTimestamp = Pusher.Util.now();
      });
      waitsFor(function() {
        substrategyDelay = Pusher.Util.now() - substrategyStartTimestamp;
        return substrategies[1].connect.wasCalled;
      }, "error callback to be called", 190);
      runs(function() {
        expect(substrategyDelay).toBeGreaterThan(99);
      });
      waitsFor(function() {
        substrategyDelay = Pusher.Util.now() - substrategyStartTimestamp;
        return substrategies[2].connect.wasCalled;
      }, "error callback to be called", 290);
      runs(function() {
        expect(substrategyDelay).toBeGreaterThan(199);
      });
      waitsFor(function() {
        substrategyDelay = Pusher.Util.now() - substrategyStartTimestamp;
        return substrategies[3].connect.wasCalled;
      }, "error callback to be called", 490);
      runs(function() {
        expect(substrategyDelay).toBeGreaterThan(399);
      });
      waitsFor(function() {
        substrategyDelay = Pusher.Util.now() - substrategyStartTimestamp;
        return substrategies[4].connect.wasCalled;
      }, "error callback to be called", 490);
      runs(function() {
        expect(substrategyDelay).toBeGreaterThan(399);
      });
    });
  });
});
