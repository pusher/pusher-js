describe("DelayedStrategy", function() {
  beforeEach(function() {
    this.substrategy = Pusher.Mocks.getStrategy(true);
    this.strategy = new Pusher.DelayedStrategy(this.substrategy, { delay: 0 });
    this.callback = jasmine.createSpy();

    jasmine.Clock.useMock();
  });

  it("should expose its name", function() {
    expect(this.strategy.name).toEqual("delayed");
  });

  describe("after calling isSupported", function() {
    it("should return true if substrategy is supported", function() {
      var substrategy = Pusher.Mocks.getStrategy(true);
      var strategy = new Pusher.DelayedStrategy(substrategy, {});
      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false if substrategy is not supported", function() {
      var substrategy = Pusher.Mocks.getStrategy(false);
      var strategy = new Pusher.DelayedStrategy(substrategy, {});
      expect(strategy.isSupported()).toBe(false);
    });
  });

  describe("on connect", function() {
    it("should connect to substrategy after a delay", function() {
      var strategy = new Pusher.DelayedStrategy(this.substrategy, {
        delay: 100
      });

      strategy.connect(this.callback);

      expect(this.substrategy.connect).not.toHaveBeenCalled();
      jasmine.Clock.tick(99);
      expect(this.substrategy.connect).not.toHaveBeenCalled();
      jasmine.Clock.tick(100);
      expect(this.substrategy.connect).toHaveBeenCalled();

      var connection = {};
      this.substrategy._callback(null, connection);

      expect(this.callback).toHaveBeenCalledWith(null, connection);
    });

    it("should pass an error when substrategy fails", function() {
      this.strategy.connect(this.callback);
      jasmine.Clock.tick(0);
      this.substrategy._callback(true);

      expect(this.callback).toHaveBeenCalledWith(true);
    });
  });

  describe("on abort", function() {
    it("should abort substrategy when connecting", function() {
      var run = this.strategy.connect();
      jasmine.Clock.tick(0);
      run.abort();
      expect(this.substrategy._abort).toHaveBeenCalled();
    });

    it("should clear the timer and not abort substrategy when waiting", function() {
      var run = this.strategy.connect();
      expect(this.substrategy.connect).not.toHaveBeenCalled();
      run.abort();
      jasmine.Clock.tick(10000);
      expect(this.substrategy._abort).not.toHaveBeenCalled();
      expect(this.substrategy.connect).not.toHaveBeenCalled();
    });
  });
});
