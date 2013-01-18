describe("AllSupportedStrategy", function() {
  beforeEach(function() {
    this.substrategies = Pusher.Mocks.getStrategies([true, true, true]);
    this.strategy = new Pusher.AllSupportedStrategy(this.substrategies);

    this.callback = jasmine.createSpy();
  });

  it("should expose its name", function() {
    expect(this.strategy.name).toEqual("all_supported");
  });

  describe("after calling isSupported", function() {
    it("should return true when all of substrategies are supported", function() {
      var substrategies = Pusher.Mocks.getStrategies([true, true]);
      var strategy = new Pusher.AllSupportedStrategy(substrategies);
      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false when one of substrategies is unsupported", function() {
      var substrategies = Pusher.Mocks.getStrategies([true, false]);
      var strategy = new Pusher.AllSupportedStrategy(substrategies);
      expect(strategy.isSupported()).toBe(false);
    });
  });
});
