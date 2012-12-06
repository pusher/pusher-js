describe("FirstConnectedStrategy", function() {
  function getSubstrategyMock(supported) {
    var substrategy = new Pusher.EventsDispatcher();

    substrategy.isSupported = jasmine.createSpy("isSupported")
      .andReturn(supported);
    substrategy.forceSecure = jasmine.createSpy("forceSecure");
    substrategy.connect = jasmine.createSpy("connect");
    substrategy.abort = jasmine.createSpy("abort");

    return substrategy;
  }

  it("should expose its name", function() {
    expect(new Pusher.FirstConnectedStrategy([]).name)
      .toEqual("first_connected");
  });

  it("should call forceSecure on all substrategies", function() {
    var substrategies = [
      getSubstrategyMock(true),
      getSubstrategyMock(true),
    ];
    var strategy = new Pusher.FirstConnectedStrategy(substrategies);

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
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);

      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false when none of substrategies is supported", function() {
      var substrategies = [
        getSubstrategyMock(false),
        getSubstrategyMock(false)
      ];
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);

      expect(strategy.isSupported()).toBe(false);
    });
  });

  describe("on connection attempt", function() {
    it("should succeed on first successful strategy and abort other running substrategies", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);

      var openCallback = jasmine.createSpy("openCallback");
      strategy.bind("open", openCallback);

      strategy.connect();

      expect(substrategies[0].connect).toHaveBeenCalled();
      expect(substrategies[1].connect).toHaveBeenCalled();
      expect(substrategies[2].connect).toHaveBeenCalled();

      var connection = {};
      substrategies[0].emit("error", 123);
      substrategies[1].emit("open", connection);

      expect(openCallback).toHaveBeenCalledWith(connection);

      expect(substrategies[0].abort).not.toHaveBeenCalled();
      expect(substrategies[1].abort).not.toHaveBeenCalled();
      expect(substrategies[2].abort).toHaveBeenCalled();
    });

    it("should emit error after all substrategies failed", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);

      var errorCallback = jasmine.createSpy("errorCallback");
      strategy.bind("error", errorCallback);

      strategy.connect();

      substrategies[1].emit("error", 666);
      expect(errorCallback).not.toHaveBeenCalled();

      substrategies[0].emit("error", 666);
      expect(errorCallback).toHaveBeenCalledWith("all substrategies failed");
    });

    it("should not connect when there are no supported substrategies", function() {
      var substrategies = [
        getSubstrategyMock(false),
        getSubstrategyMock(false)
      ];
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);

      expect(strategy.connect()).toBe(false);
      expect(substrategies[0].connect).not.toHaveBeenCalled();
      expect(substrategies[1].connect).not.toHaveBeenCalled();
    });

    it("should allow one attempt at once", function() {
      var substrategies = [
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);

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
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);

      var openCallback = jasmine.createSpy("openCallback");
      strategy.bind("open", openCallback);

      strategy.connect();
      expect(substrategies[0].connect.calls.length).toEqual(1);
      expect(substrategies[1].connect.calls.length).toEqual(1);

      var connection = {};
      substrategies[1].emit("open", connection);

      expect(substrategies[0].abort.calls.length).toEqual(1);
      expect(substrategies[1].abort.calls.length).toEqual(0);

      strategy.connect();
      expect(substrategies[0].connect.calls.length).toEqual(2);
      expect(substrategies[1].connect.calls.length).toEqual(2);

      var connection2 = {};
      substrategies[0].emit("open", connection);

      expect(substrategies[0].abort.calls.length).toEqual(1);
      expect(substrategies[1].abort.calls.length).toEqual(1);

      expect(openCallback).toHaveBeenCalledWith(connection2);
    });
  });

  describe("on aborting", function() {
    it("should send abort to all supported substrategies", function() {
      var substrategies = [
        getSubstrategyMock(false),
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);

      strategy.connect();
      strategy.abort();

      expect(substrategies[0].abort).not.toHaveBeenCalled();
      expect(substrategies[1].abort).toHaveBeenCalled();
      expect(substrategies[2].abort).toHaveBeenCalled();
    });

    it("should not abort failed substrategies", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);

      strategy.connect();
      substrategies[1].emit("error", 666);

      strategy.abort();

      expect(substrategies[0].abort).toHaveBeenCalled();
      expect(substrategies[1].abort).not.toHaveBeenCalled();
    });

    it("should not abort twice", function() {
      var substrategies = [
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);

      strategy.connect();

      expect(strategy.abort()).toBe(true);
      expect(strategy.abort()).toBe(false);
    });

    it("should not abort when there is no attempt being made", function() {
      var substrategies = [
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);

      expect(strategy.abort()).toBe(false);
      expect(substrategies[0].connect).not.toHaveBeenCalled();
      expect(substrategies[0].abort).not.toHaveBeenCalled();
    });
  });
});
