describe("SequentialStrategy", function() {
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

  function mockSetTimeout(delayList) {
    spyOn(window, "setTimeout").andCallFake(function(callback, delay) {
      expect(delayList.length).toBeGreaterThan(0);
      expect(delay).toEqual(delayList.shift());
      callback();
    });
  }

  beforeEach(function() {
    this.callback = jasmine.createSpy();
  });

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
      strategy.connect(this.callback);

      expect(substrategies[0].connect).toHaveBeenCalled();
      expect(substrategies[1].connect).not.toHaveBeenCalled();

      var connection = new Object();
      substrategies[0]._callback(null, connection);

      expect(this.callback).toHaveBeenCalledWith(null, connection);
      expect(substrategies[0]._abort).not.toHaveBeenCalled();
      expect(substrategies[1].connect).not.toHaveBeenCalled();
    });

    it("should fail after trying all supported substrategies", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(false),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies, {});

      strategy.connect(this.callback);

      expect(substrategies[0].connect).toHaveBeenCalled();
      expect(substrategies[1].connect).not.toHaveBeenCalled();

      substrategies[0]._callback(true);

      expect(substrategies[1].connect).not.toHaveBeenCalled();
      expect(substrategies[2].connect).toHaveBeenCalled();

      substrategies[2]._callback(true);

      expect(substrategies[2]._abort).not.toHaveBeenCalled();
      expect(this.callback).toHaveBeenCalledWith(true);
      expect(this.callback.calls.length).toEqual(1);
    });

    it("should support looping", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies, {
        loop: true
      });

      var runner = strategy.connect(this.callback);

      expect(substrategies[0].connect.calls.length).toEqual(1);
      expect(substrategies[1].connect.calls.length).toEqual(0);

      substrategies[0]._callback(true);

      expect(substrategies[0].connect.calls.length).toEqual(1);
      expect(substrategies[1].connect.calls.length).toEqual(1);

      substrategies[1]._callback(true);

      expect(substrategies[0].connect.calls.length).toEqual(2);
      expect(substrategies[1].connect.calls.length).toEqual(1);

      runner.abort();
      expect(substrategies[0]._abort).toHaveBeenCalled();
    });

    it("should allow reconnection", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies, {
        loop: true
      });

      strategy.connect(this.callback);
      expect(substrategies[0].connect.calls.length).toEqual(1);
      expect(substrategies[1].connect.calls.length).toEqual(0);

      var connection1 = new Object();
      substrategies[0]._callback(null, connection1);
      expect(this.callback).toHaveBeenCalledWith(null, connection1);
      expect(this.callback.calls.length).toEqual(1);

      var connection2 = new Object();
      strategy.connect(this.callback);
      substrategies[0]._callback(null, connection2);
      expect(this.callback).toHaveBeenCalledWith(null, connection2);
      expect(this.callback.calls.length).toEqual(2);
    });
  });

  describe("on aborting", function() {
    it("should send abort to substrategy and not try another one", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies, {});
      var runner = strategy.connect(this.callback);

      expect(substrategies[0].connect).toHaveBeenCalled();
      expect(substrategies[1].connect).not.toHaveBeenCalled();

      runner.abort();

      expect(substrategies[0]._abort).toHaveBeenCalled();
      expect(substrategies[1].connect).not.toHaveBeenCalled();
    });

    it("should send abort to second substrategy", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true)
      ];
      var strategy = new Pusher.SequentialStrategy(substrategies, {});
      var runner = strategy.connect(this.callback);

      substrategies[0]._callback(true);
      expect(substrategies[1].connect).toHaveBeenCalled();

      runner.abort();
      expect(substrategies[1]._abort).toHaveBeenCalled();
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
        return { abort: substrategies[0]._abort };
      });
      substrategies[1].connect = jasmine.createSpy().andCallFake(function() {
        expect(substrategies[2].connect).not.toHaveBeenCalled();
        return { abort: substrategies[1]._abort };
      });
      substrategies[2].connect = jasmine.createSpy().andCallFake(function() {
        expect(substrategies[3].connect).not.toHaveBeenCalled();
        return { abort: substrategies[2]._abort };
      });
      substrategies[3].connect = jasmine.createSpy().andCallFake(function() {
        expect(substrategies[4].connect).not.toHaveBeenCalled();
        return { abort: substrategies[3]._abort };
      });

      strategy.connect(this.callback);
      expect(setTimeout.calls.length).toEqual(5);

      expect(substrategies[0].connect).toHaveBeenCalled();
      expect(substrategies[1].connect).toHaveBeenCalled();
      expect(substrategies[2].connect).toHaveBeenCalled();
      expect(substrategies[3].connect).toHaveBeenCalled();
      expect(substrategies[4].connect).toHaveBeenCalled();
    });
  });
});
