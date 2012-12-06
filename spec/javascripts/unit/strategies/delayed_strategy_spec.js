describe("DelayedStrategy", function() {
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
    expect(new Pusher.DelayedStrategy([]).name)
      .toEqual("delayed");
  });

  it("should call forceSecure on the substrategy", function() {
    var substrategy = getSubstrategyMock(true);
    var strategy = new Pusher.DelayedStrategy(substrategy);

    strategy.forceSecure(true);
    expect(substrategy.forceSecure).toHaveBeenCalledWith(true);

    strategy.forceSecure(false);
    expect(substrategy.forceSecure).toHaveBeenCalledWith(false);
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

  describe("on connection attempt", function() {
    it("should connect to a substrategy after a delay", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 100
      });

      var openCallback = jasmine.createSpy("openCallback");
      strategy.bind("open", openCallback);

      mockSetTimeout([100, 100]);

      strategy.connect();
      expect(substrategy.connect).toHaveBeenCalled();

      var connection = {};
      substrategy.emit("open", connection);

      expect(openCallback).toHaveBeenCalledWith(connection);
    });

    it("should emit an error when the substrategy fails", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 0
      });

      var errorCallback = jasmine.createSpy();
      strategy.bind("error", errorCallback);

      mockSetTimeout([0, 0]);
      strategy.connect();
      strategy.emit("error", 123);

      expect(errorCallback).toHaveBeenCalledWith(123);
    });

    it("should allow reinitialization and reconnection", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 50
      });

      var openCallback = jasmine.createSpy("openCallback");
      strategy.bind("open", openCallback);

      mockSetTimeout([50, 50, 50, 50]);
      strategy.connect();
      expect(substrategy.connect.calls.length).toEqual(1);

      substrategy.emit("open", {});
      expect(openCallback.calls.length).toEqual(1);

      strategy.connect();
      expect(substrategy.connect.calls.length).toEqual(2);

      substrategy.emit("open", {});
      expect(openCallback.calls.length).toEqual(2);
    });

    it("should allow one attempt at once", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 0
      });

      expect(strategy.connect()).toBe(true);
      expect(strategy.connect()).toBe(false);
    });
  });

  describe("on aborting", function() {
    it("should send abort to the substrategy after connect was called", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 0
      });

      mockSetTimeout([0, 0]);
      strategy.connect();
      expect(substrategy.connect).toHaveBeenCalled();

      strategy.abort();
      expect(substrategy.abort).toHaveBeenCalled();
    });

    it("should not send abort to the substrategy before connect was called", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 0
      });

      var timerCalled = false;
      var abortCalled = false;

      strategy.abort();
      expect(substrategy.abort).not.toHaveBeenCalled();
    });

    it("should not send abort when waiting", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 0
      });

      strategy.connect();
      strategy.abort();

      expect(substrategy.connect).not.toHaveBeenCalled();
      expect(substrategy.abort).not.toHaveBeenCalled();
    });

    it("should not send abort when there's no attempt being made", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 0
      });

      strategy.abort();
      expect(substrategy.connect).not.toHaveBeenCalled();
      expect(substrategy.abort).not.toHaveBeenCalled();
    });

    it("should not send abort twice", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {
        delay: 0
      });

      strategy.connect();

      expect(strategy.abort()).toBe(true);
      expect(strategy.abort()).toBe(false);
    });
  });
});
