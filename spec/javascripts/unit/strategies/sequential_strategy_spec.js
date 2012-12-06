describe("SequentialStrategy", function() {
  function getSubstrategyMock(supported) {
    var substrategy = new Pusher.EventsDispatcher();

    substrategy.isSupported = jasmine.createSpy("isSupported")
      .andReturn(supported);
    substrategy.forceSecure = jasmine.createSpy("forceSecure");
    substrategy.connect = jasmine.createSpy("connect");
    substrategy.abort = jasmine.createSpy("abort");

    return substrategy;
  }

  function mockSetTimeout(delayList) {
    spyOn(window, "setTimeout").andCallFake(function(callback, delay) {
      expect(delayList.length).toBeGreaterThan(0);
      expect(delay).toEqual(delayList.shift());
      callback();
    });
  }

  it("should expose its name", function() {
    expect(new Pusher.SequentialStrategy([], {}).name).toEqual("seq");
  });

  it("should call forceSecure on all substrategies", function() {
    var substrategies = [
      getSubstrategyMock(true),
      getSubstrategyMock(true),
    ];
    var strategy = new Pusher.SequentialStrategy(substrategies, {});

    strategy.forceSecure(true);
    expect(substrategies[0].forceSecure).toHaveBeenCalledWith(true);
    expect(substrategies[1].forceSecure).toHaveBeenCalledWith(true);

    strategy.forceSecure(false);
    expect(substrategies[0].forceSecure).toHaveBeenCalledWith(false);
    expect(substrategies[1].forceSecure).toHaveBeenCalledWith(false);
  });

  describe("when asked if it's supported", function() {
    it("should return true when one of substrategies is supported", function() {
      var substrategies = [
        getSubstrategyMock(false),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies, {});

      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false when none of substrategies is supported", function() {
      var substrategies = [
        getSubstrategyMock(false),
        getSubstrategyMock(false)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies, {});

      expect(strategy.isSupported()).toBe(false);
    });
  });

  describe("on connection attempt", function() {
    it("should finish on first successful substrategy", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies, {});

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
      var strategy = new Pusher.SequentialStrategy(substrategies, {});

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
      var strategy = new Pusher.SequentialStrategy(substrategies, {});

      expect(strategy.connect()).toBe(true);
      expect(substrategies[0].connect.calls.length).toEqual(1);

      expect(strategy.connect()).toBe(false);
      expect(substrategies[0].connect.calls.length).toEqual(1);
    });

    it("should allow reconnection", function() {
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

      substrategies[0].emit("open", {});
      expect(substrategies[0].connect.calls.length).toEqual(1);

      strategy.connect();
      expect(substrategies[0].connect.calls.length).toEqual(2);
      expect(substrategies[1].connect.calls.length).toEqual(0);
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
      var strategy = new Pusher.SequentialStrategy(substrategies, {});

      expect(strategy.abort()).toBe(false);
      expect(substrategies[0].connect.calls.length).toEqual(0);
      expect(substrategies[0].abort.calls.length).toEqual(0);
    });
  });

  describe("on timeout", function() {
    it("should try substrategies while increasing timeout exponentially", function() {
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

      mockSetTimeout([100, 200, 400, 400, 400]);

      substrategies[0].connect = jasmine.createSpy().andCallFake(function() {
        expect(substrategies[1].connect).not.toHaveBeenCalled();
      });
      substrategies[1].connect = jasmine.createSpy().andCallFake(function() {
        expect(substrategies[2].connect).not.toHaveBeenCalled();
      });
      substrategies[2].connect = jasmine.createSpy().andCallFake(function() {
        expect(substrategies[3].connect).not.toHaveBeenCalled();
      });
      substrategies[3].connect = jasmine.createSpy().andCallFake(function() {
        expect(substrategies[4].connect).not.toHaveBeenCalled();
      });

      strategy.connect();
      expect(setTimeout.calls.length).toEqual(5);

      expect(substrategies[0].connect).toHaveBeenCalled();
      expect(substrategies[1].connect).toHaveBeenCalled();
      expect(substrategies[2].connect).toHaveBeenCalled();
      expect(substrategies[3].connect).toHaveBeenCalled();
      expect(substrategies[4].connect).toHaveBeenCalled();
    });
  });
});
