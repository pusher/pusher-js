describe("FirstConnectedStrategy", function() {
  beforeEach(function() {
    this.substrategies = Pusher.Mocks.getStrategies([true, true, true]);
    this.strategy = new Pusher.FirstConnectedStrategy(this.substrategies);

    this.callback = jasmine.createSpy();
  });

  it("should expose its name", function() {
    expect(new Pusher.FirstConnectedStrategy([]).name)
      .toEqual("first_connected");
  });

  it("should construct a secure strategy", function() {
    var substrategies = Pusher.Mocks.getStrategies([true, true]);
    var encryptedSubstrategies = Pusher.Mocks.getStrategies([true, true]);
    var strategy = new Pusher.FirstConnectedStrategy(substrategies);

    substrategies[0].getEncrypted = jasmine.createSpy()
      .andReturn(encryptedSubstrategies[0]);
    substrategies[1].getEncrypted = jasmine.createSpy()
      .andReturn(encryptedSubstrategies[1]);

    var encryptedStrategy = strategy.getEncrypted(true);
    expect(encryptedStrategy.substrategies[0]).toBe(encryptedSubstrategies[0]);
    expect(encryptedStrategy.substrategies[1]).toBe(encryptedSubstrategies[1]);
  });

  describe("when asked if it's supported", function() {
    it("should return true when one of substrategies is supported", function() {
      var substrategies = Pusher.Mocks.getStrategies([false, true]);
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);
      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false when none of substrategies is supported", function() {
      var substrategies = Pusher.Mocks.getStrategies([false, false]);
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);
      expect(strategy.isSupported()).toBe(false);
    });
  });

  describe("on connect", function() {
    it("should succeed on first successful strategy and abort non-failed substrategies", function() {
      this.strategy.connect(this.callback);

      expect(this.substrategies[0].connect).toHaveBeenCalled();
      expect(this.substrategies[1].connect).toHaveBeenCalled();
      expect(this.substrategies[2].connect).toHaveBeenCalled();

      var connection = {};
      this.substrategies[0]._callback(true);
      this.substrategies[1]._callback(null, connection);

      expect(this.callback).toHaveBeenCalledWith(null, connection);

      expect(this.substrategies[0]._abort).not.toHaveBeenCalled();
      expect(this.substrategies[1]._abort).toHaveBeenCalled();
      expect(this.substrategies[2]._abort).toHaveBeenCalled();
    });

    it("should emit error after all substrategies failed", function() {
      this.strategy.connect(this.callback);

      this.substrategies[1]._callback(true);
      expect(this.callback).not.toHaveBeenCalled();
      this.substrategies[0]._callback(true);
      expect(this.callback).not.toHaveBeenCalled();
      this.substrategies[2]._callback(true);
      expect(this.callback).toHaveBeenCalledWith(true);
    });

    it("should not connect when there are no supported substrategies", function() {
      var substrategies = Pusher.Mocks.getStrategies([false, false]);
      var strategy = new Pusher.FirstConnectedStrategy(substrategies);

      expect(strategy.connect()).toBe(null);
      expect(substrategies[0].connect).not.toHaveBeenCalled();
      expect(substrategies[1].connect).not.toHaveBeenCalled();
    });
  });

  describe("on abort", function() {
    it("should abort all substrategies", function() {
      var runner = this.strategy.connect();
      runner.abort();

      expect(this.substrategies[0]._abort).toHaveBeenCalled();
      expect(this.substrategies[1]._abort).toHaveBeenCalled();
      expect(this.substrategies[2]._abort).toHaveBeenCalled();
    });

    it("should not abort failed substrategies", function() {
      var runner = this.strategy.connect();

      this.substrategies[1]._callback(true);
      runner.abort();

      expect(this.substrategies[0]._abort).toHaveBeenCalled();
      expect(this.substrategies[1]._abort).not.toHaveBeenCalled();
      expect(this.substrategies[2]._abort).toHaveBeenCalled();
    });
  });
});
