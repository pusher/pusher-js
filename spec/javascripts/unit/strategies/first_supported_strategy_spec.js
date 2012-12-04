describe("FirstSupportedStrategy", function() {
  function getSubstrategyMock(supported) {
    var substrategy = new Pusher.EventsDispatcher();

    substrategy.isSupported = jasmine.createSpy("isSupported")
      .andReturn(supported);
    substrategy.forceSecure = jasmine.createSpy("forceSecure");
    substrategy.initialize = jasmine.createSpy("initialize");
    substrategy.connect = jasmine.createSpy("connect");
    substrategy.abort = jasmine.createSpy("abort");

    return substrategy;
  }

  it("should expose its name", function() {
    expect(new Pusher.FirstSupportedStrategy([]).name)
      .toEqual("first_supported");
  });

  it("should call forceSecure on the first supported strategy", function() {
    var substrategies = [
      getSubstrategyMock(false),
      getSubstrategyMock(true),
    ];
    var strategy = new Pusher.FirstSupportedStrategy(substrategies);

    strategy.forceSecure(true);
    expect(substrategies[0].forceSecure).not.toHaveBeenCalledWith();
    expect(substrategies[1].forceSecure).toHaveBeenCalledWith(true);

    strategy.forceSecure(false);
    expect(substrategies[0].forceSecure).not.toHaveBeenCalledWith();
    expect(substrategies[1].forceSecure).toHaveBeenCalledWith(false);
  });

  describe("when asked if it's supported", function() {
    it("should return true when one of substrategies is supported", function() {
      var substrategies = [
        getSubstrategyMock(false),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstSupportedStrategy(substrategies);

      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false when none of substrategies is supported", function() {
      var substrategies = [
        getSubstrategyMock(false),
        getSubstrategyMock(false)
      ];
      var strategy = new Pusher.FirstSupportedStrategy(substrategies);

      expect(strategy.isSupported()).toBe(false);
    });
  });

  describe("on initialization", function() {
    it("should delegate initialization to the first supported substrategy immediately", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstSupportedStrategy(substrategies);

      strategy.initialize();

      expect(substrategies[0].initialize).toHaveBeenCalled();
      expect(substrategies[1].initialize).not.toHaveBeenCalled();
    });
  });

  describe("on connection attempt", function() {
    it("should succeed on the first supported strategy", function() {
      var substrategies = [
        getSubstrategyMock(false),
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstSupportedStrategy(substrategies);

      var openCallback = jasmine.createSpy("openCallback");
      strategy.bind("open", openCallback);

      strategy.connect();

      expect(substrategies[0].connect).not.toHaveBeenCalled();
      expect(substrategies[1].connect).toHaveBeenCalled();
      expect(substrategies[2].connect).not.toHaveBeenCalled();

      var connection = {};
      substrategies[1].emit("open", connection);

      expect(openCallback).toHaveBeenCalledWith(connection);
    });

    it("should emit error after first supported strategy fails", function() {
      var substrategies = [
        getSubstrategyMock(false),
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstSupportedStrategy(substrategies);

      var errorCallback = jasmine.createSpy("errorCallback");
      strategy.bind("error", errorCallback);

      strategy.connect();
      expect(substrategies[1].connect).toHaveBeenCalled();
      substrategies[1].emit("error", 666);

      expect(errorCallback).toHaveBeenCalled();

      expect(substrategies[0].connect).not.toHaveBeenCalled();
      expect(substrategies[1].connect).toHaveBeenCalled();
      expect(substrategies[2].connect).not.toHaveBeenCalled();
    });
  });

  describe("on aborting", function() {
    it("should send abort to the first supported substrategy", function() {
      var substrategies = [
        getSubstrategyMock(false),
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstSupportedStrategy(substrategies, {});

      strategy.connect();
      strategy.abort();

      expect(substrategies[0].abort).not.toHaveBeenCalled();
      expect(substrategies[1].abort).toHaveBeenCalled();
      expect(substrategies[2].abort).not.toHaveBeenCalled();
    });
  });
});
