describe("FirstConnectedStrategy", function() {
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
    it("should succeed on first successful strategy and abort non-failed substrategies", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);

      var openCallback = jasmine.createSpy("openCallback");
      strategy.bind("open", openCallback);

      strategy.connect(this.callback);

      expect(substrategies[0].connect).toHaveBeenCalled();
      expect(substrategies[1].connect).toHaveBeenCalled();
      expect(substrategies[2].connect).toHaveBeenCalled();

      var connection = {};
      substrategies[0]._callback(true);
      substrategies[1]._callback(null, connection);

      expect(this.callback).toHaveBeenCalledWith(null, connection);

      expect(substrategies[0]._abort).not.toHaveBeenCalled();
      expect(substrategies[1]._abort).toHaveBeenCalled();
      expect(substrategies[2]._abort).toHaveBeenCalled();
    });

    it("should emit error after all substrategies failed", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);

      strategy.connect(this.callback);

      substrategies[1]._callback(true);
      expect(this.callback).not.toHaveBeenCalled();

      substrategies[0]._callback(true);
      expect(this.callback).toHaveBeenCalledWith(true);
    });

    it("should not connect when there are no supported substrategies", function() {
      var substrategies = [
        getSubstrategyMock(false),
        getSubstrategyMock(false)
      ];
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);

      expect(strategy.connect()).toBe(null);
      expect(substrategies[0].connect).not.toHaveBeenCalled();
      expect(substrategies[1].connect).not.toHaveBeenCalled();
    });

    it("should allow reconnection", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);

      strategy.connect(this.callback);
      expect(substrategies[0].connect.calls.length).toEqual(1);
      expect(substrategies[1].connect.calls.length).toEqual(1);

      var connection1 = new Object();
      substrategies[1]._callback(null, connection1);
      expect(this.callback).toHaveBeenCalledWith(null, connection1);

      expect(substrategies[0]._abort.calls.length).toEqual(1);
      expect(substrategies[1]._abort.calls.length).toEqual(1);

      strategy.connect(this.callback);
      expect(substrategies[0].connect.calls.length).toEqual(2);
      expect(substrategies[1].connect.calls.length).toEqual(2);

      var connection2 = new Object();
      substrategies[0]._callback(null, connection2);

      expect(substrategies[0]._abort.calls.length).toEqual(2);
      expect(substrategies[1]._abort.calls.length).toEqual(2);

      expect(this.callback).toHaveBeenCalledWith(null, connection2);
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

      var runner = strategy.connect();
      runner.abort();

      expect(substrategies[0]._abort).not.toHaveBeenCalled();
      expect(substrategies[1]._abort).toHaveBeenCalled();
      expect(substrategies[2]._abort).toHaveBeenCalled();
    });

    it("should not abort failed substrategies", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);

      var runner = strategy.connect();
      substrategies[1]._callback(true);
      runner.abort();

      expect(substrategies[0]._abort).toHaveBeenCalled();
      expect(substrategies[1]._abort).not.toHaveBeenCalled();
    });
  });
});
