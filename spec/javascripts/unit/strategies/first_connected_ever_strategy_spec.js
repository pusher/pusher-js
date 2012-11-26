describe("FirstConnectedEverStrategy", function() {
  function getSubstrategyMock(supported) {
    var substrategy = new Pusher.EventsDispatcher();

    substrategy.initialize = jasmine.createSpy("initialize");
    substrategy.connect = jasmine.createSpy("connect");
    substrategy.abort = jasmine.createSpy("abort");
    substrategy.isSupported = jasmine.createSpy("initialize")
      .andReturn(supported);

    return substrategy;
  }

  it("should expose its name", function() {
    expect(new Pusher.FirstConnectedEverStrategy([]).name)
      .toEqual("first_connected_ever");
  });

  describe("on connection attempt", function() {
    it("should emit connections from all successful substrategies", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true),
        getSubstrategyMock(true),
      ];
      var strategy = new Pusher.FirstConnectedEverStrategy(substrategies);

      var openCallback = jasmine.createSpy("openCallback");
      strategy.bind("open", openCallback);

      strategy.connect();

      expect(substrategies[0].connect).toHaveBeenCalled();
      expect(substrategies[1].connect).toHaveBeenCalled();
      expect(substrategies[2].connect).toHaveBeenCalled();

      var connection = {};
      substrategies[0].emit("error", 123);
      substrategies[1].emit("open", connection);

      expect(openCallback).toHaveBeenCalledWith(connection);
      expect(openCallback.calls.length).toEqual(1);

      substrategies[2].emit("open", connection);
      expect(openCallback.calls.length).toEqual(2);

      expect(substrategies[0].abort).not.toHaveBeenCalled();
      expect(substrategies[1].abort).not.toHaveBeenCalled();
      expect(substrategies[2].abort).not.toHaveBeenCalled();
    });

    it("should emit error after all substrategies failed", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true),
      ];
      var strategy = new Pusher.FirstConnectedEverStrategy(substrategies);

      var errorCallback = jasmine.createSpy("errorCallback");
      strategy.bind("error", errorCallback);

      strategy.connect();

      substrategies[1].emit("error", 666);
      expect(errorCallback).not.toHaveBeenCalled();

      substrategies[0].emit("error", 666);
      expect(errorCallback).toHaveBeenCalledWith("all substrategies failed");
    });

    it("should not emit errors after one substrategy succeede and other failed", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true),
      ];
      var strategy = new Pusher.FirstConnectedEverStrategy(substrategies);

      var errorCallback = jasmine.createSpy("errorCallback");
      strategy.bind("error", errorCallback);

      strategy.connect();

      substrategies[0].emit("open", {});
      expect(errorCallback).not.toHaveBeenCalled();

      substrategies[1].emit("error", {});
      expect(errorCallback).not.toHaveBeenCalled();
    });
  });

  describe("on aborting", function() {
    it("should not abort failed nor succeeded substrategies", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true),
        getSubstrategyMock(true),
      ];
      var strategy = new Pusher.FirstConnectedEverStrategy(substrategies);

      strategy.connect();
      substrategies[1].emit("error", 666);
      substrategies[2].emit("open", {});

      strategy.abort();

      expect(substrategies[0].abort).toHaveBeenCalled();
      expect(substrategies[1].abort).not.toHaveBeenCalled();
      expect(substrategies[2].abort).not.toHaveBeenCalled();
    });

    it("should not allow aborting after all strategies succeeded", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true),
      ];
      var strategy = new Pusher.FirstConnectedEverStrategy(substrategies);

      strategy.connect();
      substrategies[0].emit("open", {});
      substrategies[1].emit("open", {});

      expect(strategy.abort()).toBe(false);

      expect(substrategies[0].abort).not.toHaveBeenCalled();
      expect(substrategies[1].abort).not.toHaveBeenCalled();
    });

    it("should not allow aborting after all strategies failed", function() {
      var substrategies = [
        getSubstrategyMock(true),
        getSubstrategyMock(true),
      ];
      var strategy = new Pusher.FirstConnectedEverStrategy(substrategies);

      strategy.connect();
      substrategies[0].emit("error", {});
      substrategies[1].emit("error", {});

      expect(strategy.abort()).toBe(false);

      expect(substrategies[0].abort).not.toHaveBeenCalled();
      expect(substrategies[1].abort).not.toHaveBeenCalled();
    });
  });
});
