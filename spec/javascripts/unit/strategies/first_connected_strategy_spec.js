describe("FirstConnectedStrategy", function() {
  var substrategy;
  var callback;
  var strategy;

  beforeEach(function() {
    substrategy = Pusher.Mocks.getStrategy(true);
    strategy = new Pusher.FirstConnectedStrategy(substrategy);
    state = {};

    callback = jasmine.createSpy();
  });

  it("should expose its name", function() {
    expect(strategy.name).toEqual("first_connected");
  });

  describe("after calling isSupported", function() {
    it("should return true when the substrategy is supported", function() {
      var substrategy = Pusher.Mocks.getStrategy(true);
      var strategy = new Pusher.FirstConnectedStrategy(substrategy);
      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false when the substrategy is not supported", function() {
      var substrategy = Pusher.Mocks.getStrategy(false);
      var strategy = new Pusher.FirstConnectedStrategy(substrategy);
      expect(strategy.isSupported()).toBe(false);
    });
  });

  describe("on connect", function() {
    it("should succeed on first connection and abort the substrategy", function() {
      strategy.connect(callback);

      expect(substrategy.connect).toHaveBeenCalledWith(jasmine.any(Function));

      var connection = {};
      substrategy._callback(null, connection);

      expect(callback).toHaveBeenCalledWith(null, connection);
      expect(substrategy._abort).toHaveBeenCalled();
    });

    it("should pass an error when the substrategy fails", function() {
      strategy.connect(callback);

      substrategy._callback(true);
      expect(callback).toHaveBeenCalledWith(true, undefined);
    });
  });

  describe("on abort", function() {
    it("should abort the substrategy", function() {
      var runner = strategy.connect();
      runner.abort();
      expect(substrategy._abort).toHaveBeenCalled();
    });
  });
});
