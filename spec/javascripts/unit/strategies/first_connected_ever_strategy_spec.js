describe("FirstConnectedEverStrategy", function() {
  beforeEach(function() {
    this.substrategies = Pusher.Mocks.getStrategies([true, true, true]);
    this.strategy = new Pusher.FirstConnectedEverStrategy(this.substrategies);

    this.callback = jasmine.createSpy();
  });

  it("should expose its name", function() {
    expect(this.strategy.name).toEqual("first_connected_ever");
  });

  it("should construct a secure strategy", function() {
    var substrategies = Pusher.Mocks.getStrategies([true, true]);
    var encryptedSubstrategies = Pusher.Mocks.getStrategies([true, true]);
    var strategy = new Pusher.FirstConnectedEverStrategy(substrategies);

    substrategies[0].getEncrypted = jasmine.createSpy()
      .andReturn(encryptedSubstrategies[0]);
    substrategies[1].getEncrypted = jasmine.createSpy()
      .andReturn(encryptedSubstrategies[1]);

    var encryptedStrategy = strategy.getEncrypted(true);
    expect(encryptedStrategy.substrategies[0]).toBe(encryptedSubstrategies[0]);
    expect(encryptedStrategy.substrategies[1]).toBe(encryptedSubstrategies[1]);
  });

  describe("on connect", function() {
    it("should call back with all connections", function() {
      this.strategy.connect(this.callback);

      expect(this.substrategies[0].connect).toHaveBeenCalled();
      expect(this.substrategies[1].connect).toHaveBeenCalled();
      expect(this.substrategies[2].connect).toHaveBeenCalled();

      var transport1 = Pusher.Mocks.getTransport();
      this.substrategies[0]._callback(true);
      this.substrategies[1]._callback(null, transport1);

      expect(this.callback).toHaveBeenCalledWith(null, transport1);
      expect(this.callback.calls.length).toEqual(1);

      var transport2 = Pusher.Mocks.getTransport();
      this.substrategies[2]._callback(null, transport2);
      expect(this.callback).toHaveBeenCalledWith(null, transport2);
      expect(this.callback.calls.length).toEqual(2);

      var transport3 = Pusher.Mocks.getTransport();
      this.substrategies[2]._callback(null, transport3);
      expect(this.callback).toHaveBeenCalledWith(null, transport3);
      expect(this.callback.calls.length).toEqual(3);

      expect(this.substrategies[0]._abort).not.toHaveBeenCalled();
      expect(this.substrategies[1]._abort).not.toHaveBeenCalled();
      expect(this.substrategies[2]._abort).not.toHaveBeenCalled();
    });

    it("should pass an error after all substrategies failed", function() {
      this.strategy.connect(this.callback);

      this.substrategies[1]._callback(true);
      expect(this.callback).not.toHaveBeenCalled();
      this.substrategies[0]._callback(true);
      expect(this.callback).not.toHaveBeenCalled();
      this.substrategies[2]._callback(true);
      expect(this.callback).toHaveBeenCalledWith(true);
    });

    it("should pass errors after one substrategy succeeded", function() {
      this.strategy.connect(this.callback);

      var transport = Pusher.Mocks.getTransport();
      this.substrategies[0]._callback(null, transport);
      expect(this.callback).toHaveBeenCalledWith(null, transport);
      expect(this.callback.calls.length).toEqual(1);

      this.substrategies[1]._callback(true);
      expect(this.callback.calls.length).toEqual(1);
      this.substrategies[2]._callback(true);
      expect(this.callback.calls.length).toEqual(1);
    });
  });

  describe("on abort", function() {
    it("should abort non-failed substrategies", function() {
      var runner = this.strategy.connect(this.callback);

      this.substrategies[1]._callback(true);
      this.substrategies[2]._callback(null, new Object());
      runner.abort();

      expect(this.substrategies[0]._abort).toHaveBeenCalled();
      expect(this.substrategies[1]._abort).not.toHaveBeenCalled();
      expect(this.substrategies[2]._abort).toHaveBeenCalled();
    });
  });
});
