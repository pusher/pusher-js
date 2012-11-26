describe("DelayedStrategy", function() {
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
    expect(new Pusher.DelayedStrategy([]).name)
      .toEqual("delayed");
  });

  describe("when asked if it's supported", function() {
    it("should return true if the substrategy is supported", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy);

      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false if the substrategy is not supported", function() {
      var substrategy = getSubstrategyMock(false);
      var strategy = new Pusher.DelayedStrategy(substrategy);

      expect(strategy.isSupported()).toBe(false);
    });
  });

  describe("on initialization", function() {
    it("should delegate initialization to the substrategy with a delay", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 200,
      });

      var startTimestamp = Date.now();
      var initializeCalledAt = null;
      substrategy.initialize = jasmine.createSpy().andCallFake(function() {
        initializeCalledAt = Date.now();
      });

      runs(function() {
        strategy.initialize();
      });
      waitsFor(function() {
        return initializeCalledAt;
      }, "initialize to be called", 400);
      runs(function() {
        expect(initializeCalledAt - startTimestamp).toBeGreaterThan(180);
      });
    });
  });

  describe("on connection attempt", function() {
    it("should connect to a substrategy after a delay", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 200,
      });

      var openCallback = jasmine.createSpy("openCallback");
      strategy.bind("open", openCallback);

      var startTimestamp = Date.now();
      var initializeCalledAt = null;
      var connectCalledAt = null;
      substrategy.initialize = jasmine.createSpy().andCallFake(function() {
        initializeCalledAt = Date.now();
        expect(connectCalledAt).toBe(null);
      });
      substrategy.connect = jasmine.createSpy().andCallFake(function() {
        connectCalledAt = Date.now();
      });

      runs(function() {
        strategy.initialize();
        strategy.connect();
      });
      waitsFor(function() {
        return connectCalledAt;
      }, "connect to be called", 400);
      runs(function() {
        expect(initializeCalledAt - startTimestamp).toBeGreaterThan(180);
        expect(connectCalledAt - startTimestamp).toBeGreaterThan(180);

        var connection = {};
        substrategy.emit("open", connection);

        expect(openCallback).toHaveBeenCalledWith(connection);
      });
    });

    it("should emit an error when the substrategy fails", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 0,
      });

      var errorCallback = jasmine.createSpy();
      strategy.bind("error", errorCallback);

      var startTimestamp = Date.now();
      var connectCalled = false;
      substrategy.connect = jasmine.createSpy().andCallFake(function() {
        connectCalled = true;
      });

      runs(function() {
        strategy.initialize();
        strategy.connect();
      });
      waitsFor(function() {
        return connectCalled;
      }, "connect to be called", 10);
      runs(function() {
        strategy.emit("error", 123);
        expect(errorCallback).toHaveBeenCalledWith(123);
      });
    });

    it("should allow reinitialization and reconnection", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 50,
      });

      var openCallback = jasmine.createSpy("openCallback");
      strategy.bind("open", openCallback);

      runs(function() {
        strategy.initialize();
        strategy.connect();
      });
      waitsFor(function() {
        return substrategy.initialize.calls.length == 1;
      }, "initialize to be called", 100);
      waitsFor(function() {
        return substrategy.connect.calls.length == 1;
      }, "connect to be called", 100);
      runs(function() {
        expect(substrategy.initialize.calls.length).toEqual(1);
        substrategy.emit("open", {});

        expect(openCallback.calls.length).toEqual(1);

        strategy.initialize();
        strategy.connect();
      });
      waitsFor(function() {
        return substrategy.initialize.calls.length == 2;
      }, "initialize to be called again", 100);
      waitsFor(function() {
        return substrategy.connect.calls.length == 2;
      }, "connect to be called again", 100);
      runs(function() {
        substrategy.emit("open", {});
        expect(openCallback.calls.length).toEqual(2);
      });
    });

    it("should allow one attempt at once", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 0,
      });

      expect(strategy.connect()).toBe(true);
      expect(strategy.connect()).toBe(false);
    });
  });

  describe("on aborting", function() {
    it("should send abort to the substrategy after connect was called", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 0,
      });

      var timerCalled = false;
      var abortCalled = false;

      substrategy.connect = jasmine.createSpy("connect").andCallFake(function() {
        strategy.abort();
        abortCalled = true;
      });

      runs(function() {
        strategy.initialize();
        strategy.connect();
      });
      waitsFor(function() {
        return abortCalled;
      }, "attempt to be aborted", 50);
      runs(function() {
        expect(substrategy.abort).toHaveBeenCalled();

        setTimeout(function() {
          timerCalled = true;
        }, 10);
      });
      waitsFor(function() {
        return timerCalled;
      }, "~10ms", 50);
      runs(function() {
        expect(substrategy.initialize).toHaveBeenCalled();
      });
    });

    it("should not send abort to the substrategy before connect was called", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 0,
      });

      var timerCalled = false;
      var abortCalled = false;

      substrategy.initialize = jasmine.createSpy().andCallFake(function() {
        expect(substrategy.connect).not.toHaveBeenCalled();
        strategy.abort();
        abortCalled = true;
      });

      runs(function() {
        strategy.initialize();
        strategy.connect();
      });
      waitsFor(function() {
        return abortCalled;
      }, "attempt to be aborted", 50);
      runs(function() {
        expect(substrategy.abort).not.toHaveBeenCalled();

        setTimeout(function() {
          timerCalled = true;
        }, 10);
      });
      waitsFor(function() {
        return timerCalled;
      }, "~10ms", 50);
      runs(function() {
        expect(substrategy.connect).not.toHaveBeenCalled();
      });
    });

    it("should not send abort when waiting", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 0,
      });

      strategy.initialize();
      strategy.connect();
      strategy.abort();

      expect(substrategy.initialize).not.toHaveBeenCalled();
      expect(substrategy.connect).not.toHaveBeenCalled();
      expect(substrategy.abort).not.toHaveBeenCalled();
    });

    it("should not send abort when there's no attempt being made", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 0,
      });

      strategy.abort();
      expect(substrategy.initialize).not.toHaveBeenCalled();
      expect(substrategy.connect).not.toHaveBeenCalled();
      expect(substrategy.abort).not.toHaveBeenCalled();
    });

    it("should not send abort twice", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 0,
      });

      strategy.initialize();
      strategy.connect();

      expect(strategy.abort()).toBe(true);
      expect(strategy.abort()).toBe(false);
    });
  });
});
