describe("FirstSupportedStrategy", function() {
  beforeEach(function() {
    this.substrategies = Pusher.Mocks.getStrategies([false, true, true]);
    this.strategy = new Pusher.FirstSupportedStrategy(this.substrategies);

    this.callback = jasmine.createSpy();
  });

  it("should expose its name", function() {
    expect(this.strategy.name).toEqual("first_supported");
  });

  describe("after calling isSupported", function() {
    it("should return true when one of substrategies is supported", function() {
      var substrategies = Pusher.Mocks.getStrategies([false, true]);
      var strategy = new Pusher.FirstSupportedStrategy(substrategies);
      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false when none of substrategies is supported", function() {
      var substrategies = Pusher.Mocks.getStrategies([false, false]);
      var strategy = new Pusher.FirstSupportedStrategy(substrategies);
      expect(strategy.isSupported()).toBe(false);
    });
  });

  describe("on connect", function() {
    it("should succeed on the first supported strategy", function() {
      this.strategy.connect(this.callback);

      expect(this.substrategies[0].connect).not.toHaveBeenCalled();
      expect(this.substrategies[1].connect).toHaveBeenCalled();
      expect(this.substrategies[2].connect).not.toHaveBeenCalled();

      var connection = {};
      this.substrategies[1]._callback(null, connection);

      expect(this.callback).toHaveBeenCalledWith(null, connection);
    });

    it("should pass an error after first supported strategy fails", function() {
      this.strategy.connect(this.callback);

      expect(this.substrategies[1].connect).toHaveBeenCalled();
      this.substrategies[1]._callback(true);

      expect(this.callback).toHaveBeenCalledWith(true);

      expect(this.substrategies[0].connect).not.toHaveBeenCalled();
      expect(this.substrategies[1].connect).toHaveBeenCalled();
      expect(this.substrategies[2].connect).not.toHaveBeenCalled();
    });
  });

  describe("on abort", function() {
    it("should send abort only to first supported substrategy", function() {
      var runner = this.strategy.connect(this.callback);

      runner.abort();

      expect(this.substrategies[0]._abort).not.toHaveBeenCalled();
      expect(this.substrategies[1]._abort).toHaveBeenCalled();
      expect(this.substrategies[2]._abort).not.toHaveBeenCalled();
    });
  });
});
