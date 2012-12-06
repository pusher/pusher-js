describe("FirstSupportedStrategy", function() {
  function getSubstrategyMock(supported) {
    var substrategy = new Pusher.EventsDispatcher();

    substrategy.forceSecure = jasmine.createSpy("forceSecure");
    substrategy.isSupported = jasmine.createSpy("isSupported")
      .andReturn(supported);
    substrategy.connect = jasmine.createSpy("connect")
      .andCallFake(function(callback) {
        substrategy._callback = callback;
        return { abort: substrategy._abort }
      });

    substrategy._abort = jasmine.createSpy();

    return substrategy;
  }

  beforeEach(function() {
    this.callback = jasmine.createSpy();
  });

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

  describe("on connection attempt", function() {
    it("should succeed on the first supported strategy", function() {
      var substrategies = [
        getSubstrategyMock(false),
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstSupportedStrategy(substrategies);
      strategy.connect(this.callback);

      expect(substrategies[0].connect).not.toHaveBeenCalled();
      expect(substrategies[1].connect).toHaveBeenCalled();
      expect(substrategies[2].connect).not.toHaveBeenCalled();

      var connection = new Object();
      substrategies[1]._callback(null, connection);

      expect(this.callback).toHaveBeenCalledWith(null, connection);
    });

    it("should emit error after first supported strategy fails", function() {
      var substrategies = [
        getSubstrategyMock(false),
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstSupportedStrategy(substrategies);
      strategy.connect(this.callback);

      expect(substrategies[1].connect).toHaveBeenCalled();
      substrategies[1]._callback(true);

      expect(this.callback).toHaveBeenCalledWith(true);

      expect(substrategies[0].connect).not.toHaveBeenCalled();
      expect(substrategies[1].connect).toHaveBeenCalled();
      expect(substrategies[2].connect).not.toHaveBeenCalled();
    });
  });

  describe("on aborting", function() {
    it("should send abort only to the first supported substrategy", function() {
      var substrategies = [
        getSubstrategyMock(false),
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstSupportedStrategy(substrategies, {});
      var runner = strategy.connect(this.callback);

      runner.abort();

      expect(substrategies[0]._abort).not.toHaveBeenCalled();
      expect(substrategies[1]._abort).toHaveBeenCalled();
      expect(substrategies[2]._abort).not.toHaveBeenCalled();
    });
  });
});
