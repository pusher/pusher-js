describe("DelayedStrategy", function() {
  function mockSetTimeout(delayList) {
    spyOn(window, "setTimeout").andCallFake(function(callback, delay) {
      expect(delayList.length).toBeGreaterThan(0);
      expect(delay).toEqual(delayList.shift());
      callback();
    });
  }

  beforeEach(function() {
    this.substrategy = Pusher.Mocks.getStrategy(true);
    this.strategy = new Pusher.DelayedStrategy(this.substrategy, { delay: 0 });

    this.callback = jasmine.createSpy();
  });

  it("should expose its name", function() {
    expect(this.strategy.name).toEqual("delayed");
  });

  it("should construct a secure strategy", function() {
    var substrategy = Pusher.Mocks.getStrategy(true);
    var encryptedSubstrategy = Pusher.Mocks.getStrategy(true);
    var strategy = new Pusher.DelayedStrategy(substrategy, { delay: 1 });

    substrategy.getEncrypted = jasmine.createSpy()
      .andReturn(encryptedSubstrategy);

    var encryptedStrategy = strategy.getEncrypted(true);
    expect(encryptedStrategy.substrategy).toBe(encryptedSubstrategy);
    expect(encryptedStrategy.delay).toEqual(strategy.delay);
  });

  describe("after calling isSupported", function() {
    it("should return true if the substrategy is supported", function() {
      var substrategy = Pusher.Mocks.getStrategy(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {});
      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false if the substrategy is not supported", function() {
      var substrategy = Pusher.Mocks.getStrategy(false);
      var strategy = new Pusher.DelayedStrategy(substrategy, {});
      expect(strategy.isSupported()).toBe(false);
    });
  });

  describe("on connect", function() {
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
  });

  describe("on abort", function() {
    it("should abort the substrategy when connecting", function() {
      mockSetTimeout([0]);
      var run = this.strategy.connect();
      expect(this.substrategy.connect).toHaveBeenCalled();

      run.abort();
      expect(this.substrategy._abort).toHaveBeenCalled();
    });

    it("should clear the timer and not abort the substrategy when waiting", function() {
      // do not fire the connect timer
      spyOn(window, "setTimeout").andReturn(111);
      spyOn(window, "clearTimeout");

      var run = this.strategy.connect();
      expect(this.substrategy.connect).not.toHaveBeenCalled();

      expect(clearTimeout).not.toHaveBeenCalled();
      run.abort();
      expect(this.substrategy._abort).not.toHaveBeenCalled();
      expect(clearTimeout).toHaveBeenCalledWith(111);
    });
  });
});
