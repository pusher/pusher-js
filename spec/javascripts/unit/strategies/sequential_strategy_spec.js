describe("SequentialStrategy", function() {
  function mockSetTimeout(delayList) {
    spyOn(window, "setTimeout").andCallFake(function(callback, delay) {
      expect(delayList.length).toBeGreaterThan(0);
      expect(delay).toEqual(delayList.shift());
      callback();
    });
  }

  beforeEach(function() {
    this.callback = jasmine.createSpy();
    this.substrategies = Pusher.Mocks.getStrategies([true, true]);
    this.strategy = new Pusher.SequentialStrategy(this.substrategies, {})
  });

  it("should expose its name", function() {
    expect(this.strategy.name).toEqual("seq");
  });

  it("should construct a secure strategy", function() {
    var substrategies = Pusher.Mocks.getStrategies([true, true]);
    var encryptedSubstrategies = Pusher.Mocks.getStrategies([true, true]);
    var strategy = new Pusher.SequentialStrategy(substrategies, {
      loop: true,
      timeout: 1,
      timeoutLimit: 2
    });

    substrategies[0].getEncrypted = jasmine.createSpy()
      .andReturn(encryptedSubstrategies[0]);
    substrategies[1].getEncrypted = jasmine.createSpy()
      .andReturn(encryptedSubstrategies[1]);

    var encryptedStrategy = strategy.getEncrypted(true);

    expect(encryptedStrategy.loop).toBe(true);
    expect(encryptedStrategy.timeout).toEqual(1);
    expect(encryptedStrategy.timeoutLimit).toEqual(2);
    expect(encryptedStrategy.substrategies[0]).toBe(encryptedSubstrategies[0]);
    expect(encryptedStrategy.substrategies[1]).toBe(encryptedSubstrategies[1]);
  });

  describe("after calling isSupported", function() {
    it("should return true when one of substrategies is supported", function() {
      var substrategies = Pusher.Mocks.getStrategies([false, true]);
      var strategy = new Pusher.SequentialStrategy(substrategies, {});
      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false when none of substrategies are supported", function() {
      var substrategies = Pusher.Mocks.getStrategies([false, false]);
      var strategy = new Pusher.SequentialStrategy(substrategies, {});
      expect(strategy.isSupported()).toBe(false);
    });
  });

  describe("on connect", function() {
    it("should finish on first successful substrategy", function() {
      this.strategy.connect(this.callback);

      expect(this.substrategies[0].connect).toHaveBeenCalled();
      expect(this.substrategies[1].connect).not.toHaveBeenCalled();

      var connection = new Object();
      this.substrategies[0]._callback(null, connection);

      expect(this.callback).toHaveBeenCalledWith(null, connection);
      expect(this.substrategies[0]._abort).not.toHaveBeenCalled();
      expect(this.substrategies[1].connect).not.toHaveBeenCalled();
    });

    it("should fail after trying all supported substrategies", function() {
      this.strategy.connect(this.callback);

      expect(this.substrategies[0].connect).toHaveBeenCalled();
      expect(this.substrategies[1].connect).not.toHaveBeenCalled();

      this.substrategies[0]._callback(true);
      expect(this.substrategies[1].connect).toHaveBeenCalled();

      this.substrategies[1]._callback(true);
      expect(this.substrategies[1]._abort).not.toHaveBeenCalled();
      expect(this.callback).toHaveBeenCalledWith(true);
      expect(this.callback.calls.length).toEqual(1);
    });

    it("should support looping", function() {
      var strategy = new Pusher.SequentialStrategy(this.substrategies, {
        loop: true
      })
      var runner = strategy.connect(this.callback);

      expect(this.substrategies[0].connect.calls.length).toEqual(1);
      expect(this.substrategies[1].connect.calls.length).toEqual(0);

      this.substrategies[0]._callback(true);

      expect(this.substrategies[0].connect.calls.length).toEqual(1);
      expect(this.substrategies[1].connect.calls.length).toEqual(1);

      this.substrategies[1]._callback(true);

      expect(this.substrategies[0].connect.calls.length).toEqual(2);
      expect(this.substrategies[1].connect.calls.length).toEqual(1);

      runner.abort();
      expect(this.substrategies[0]._abort).toHaveBeenCalled();
    });
  });

  describe("on abort", function() {
    it("should send abort to first tried substrategy", function() {
      var runner = this.strategy.connect(this.callback);

      expect(this.substrategies[0].connect).toHaveBeenCalled();
      expect(this.substrategies[1].connect).not.toHaveBeenCalled();

      runner.abort();

      expect(this.substrategies[0]._abort).toHaveBeenCalled();
      expect(this.substrategies[1].connect).not.toHaveBeenCalled();
    });

    it("should send abort to second tried substrategy", function() {
      var runner = this.strategy.connect(this.callback);

      this.substrategies[0]._callback(true);
      expect(this.substrategies[1].connect).toHaveBeenCalled();

      runner.abort();
      expect(this.substrategies[1]._abort).toHaveBeenCalled();
    });
  });

  describe("on timeout", function() {
    it("should try substrategies with exponential timeouts", function() {
      var substrategies = Pusher.Mocks.getStrategies(
        [true, true, true, true, true]
      );
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
