describe("FirstConnectedEverStrategy", function() {
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
    expect(new Pusher.FirstConnectedEverStrategy([]).name)
      .toEqual("first_connected_ever");
  });

  it("should call forceSecure on all substrategies", function() {
    var substrategies = [
      getSubstrategyMock(true),
      getSubstrategyMock(true),
    ];
    var strategy = new Pusher.FirstConnectedEverStrategy(substrategies);

    strategy.forceSecure(true);
    expect(substrategies[0].forceSecure).toHaveBeenCalledWith(true);
    expect(substrategies[1].forceSecure).toHaveBeenCalledWith(true);

    strategy.forceSecure(false);
    expect(substrategies[0].forceSecure).toHaveBeenCalledWith(false);
    expect(substrategies[1].forceSecure).toHaveBeenCalledWith(false);
  });

  describe("on connection attempt", function() {
    it("should emit connections from all successful substrategies", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstConnectedEverStrategy(substrategies);
      strategy.connect(this.callback);

      expect(substrategies[0].connect).toHaveBeenCalled();
      expect(substrategies[1].connect).toHaveBeenCalled();
      expect(substrategies[2].connect).toHaveBeenCalled();

      var connection1 = new Object();
      substrategies[0]._callback(true);
      substrategies[1]._callback(null, connection1);

      expect(this.callback).toHaveBeenCalledWith(null, connection1);
      expect(this.callback.calls.length).toEqual(1);

      var connection2 = new Object();
      substrategies[2]._callback(null, connection2);
      expect(this.callback).toHaveBeenCalledWith(null, connection2);
      expect(this.callback.calls.length).toEqual(2);

      expect(substrategies[0]._abort).not.toHaveBeenCalled();
      expect(substrategies[1]._abort).not.toHaveBeenCalled();
      expect(substrategies[2]._abort).not.toHaveBeenCalled();
    });

    it("should emit error after all substrategies failed", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstConnectedEverStrategy(substrategies);
      strategy.connect(this.callback);

      substrategies[1]._callback(true);
      expect(this.callback).not.toHaveBeenCalled();

      substrategies[0]._callback(true);
      expect(this.callback).toHaveBeenCalledWith(true);
    });

    it("should not emit errors after one substrategy succeeded and all other failed", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstConnectedEverStrategy(substrategies);
      strategy.connect(this.callback);

      var connection = new Object();
      substrategies[0]._callback(null, connection);
      expect(this.callback).toHaveBeenCalledWith(null, connection);
      expect(this.callback.calls.length).toEqual(1);

      substrategies[1]._callback(true);
      expect(this.callback.calls.length).toEqual(1);
    });
  });

  describe("on aborting", function() {
    it("should abort non-failed substrategies", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.FirstConnectedEverStrategy(substrategies);

      var runner = strategy.connect(this.callback);
      substrategies[1]._callback(true);
      substrategies[2]._callback(null, new Object());

      runner.abort();

      expect(substrategies[0]._abort).toHaveBeenCalled();
      expect(substrategies[1]._abort).not.toHaveBeenCalled();
      expect(substrategies[2]._abort).toHaveBeenCalled();
    });
  });
});
