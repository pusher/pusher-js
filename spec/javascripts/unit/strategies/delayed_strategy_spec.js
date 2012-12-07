describe("DelayedStrategy", function() {
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
    this.substrategy = getSubstrategyMock(true);
    this.strategy = new Pusher.DelayedStrategy(this.substrategy, { delay: 0 });
    this.callback = jasmine.createSpy();
  });

  it("should expose its name", function() {
    expect(this.strategy.name).toEqual("delayed");
  });


  it("should construct a secure strategy", function() {
    var encryptedSubstrategy = getSubstrategyMock(true);

    this.substrategy.getEncrypted = jasmine.createSpy()
      .andReturn(encryptedSubstrategy);

    var encryptedStrategy = this.strategy.getEncrypted(true);
    expect(encryptedStrategy.substrategy).toBe(encryptedSubstrategy);
    expect(encryptedStrategy.delay).toEqual(this.strategy.delay);
  });

  describe("when asked if it's supported", function() {
    it("should return true if the substrategy is supported", function() {
      var substrategy = getSubstrategyMock(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {});

      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false if the substrategy is not supported", function() {
      var substrategy = getSubstrategyMock(false);
      var strategy = new Pusher.DelayedStrategy(substrategy, {});

      expect(strategy.isSupported()).toBe(false);
    });
  });

  describe("on connection attempt", function() {
    it("should connect to a substrategy after a delay", function() {
      var strategy = new Pusher.DelayedStrategy(this.substrategy, {
        delay: 100
      });

      mockSetTimeout([100]);
      strategy.connect(this.callback);
      expect(this.substrategy.connect).toHaveBeenCalled();

      var connection = new Object();
      this.substrategy._callback(null, connection);

      expect(this.callback).toHaveBeenCalledWith(null, connection);
    });

    it("should pass the error when the substrategy fails", function() {
      mockSetTimeout([0]);
      this.strategy.connect(this.callback);
      this.substrategy._callback(true)

      expect(this.callback).toHaveBeenCalledWith(true);
    });

    it("should allow reconnection", function() {
      mockSetTimeout([0, 0]);

      var connection1 = new Object();
      this.strategy.connect(this.callback);
      this.substrategy._callback(null, connection1);
      expect(this.substrategy.connect.calls.length).toEqual(1);
      expect(this.callback.calls.length).toEqual(1);
      expect(this.callback).toHaveBeenCalledWith(null, connection1);

      var connection2 = new Object();
      this.strategy.connect(this.callback);
      this.substrategy._callback(null, connection2);
      expect(this.substrategy.connect.calls.length).toEqual(2);
      expect(this.callback.calls.length).toEqual(2);
      expect(this.callback).toHaveBeenCalledWith(null, connection2);
    });
  });

  describe("on aborting", function() {
    it("should abort the substrategy when connecting", function() {
      mockSetTimeout([0]);
      var run = this.strategy.connect();
      expect(this.substrategy.connect).toHaveBeenCalled();

      run.abort();
      expect(this.substrategy._abort).toHaveBeenCalled();
    });

    it("should not abort the substrategy when waiting", function() {
      // do not fire the connect timer
      spyOn(window, "setTimeout").andCallFake(function() {});

      var run = this.strategy.connect();
      expect(this.substrategy.connect).not.toHaveBeenCalled();

      run.abort();
      expect(this.substrategy._abort).not.toHaveBeenCalled();
    });
  });
});
