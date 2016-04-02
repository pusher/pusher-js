var Mocks = require("mocks");
var BestConnectedEverStrategy = require('core/strategies/best_connected_ever_strategy').default;

describe("BestConnectedEverStrategy", function() {
  beforeEach(function() {
    this.substrategies = Mocks.getStrategies([true, true, true]);
    this.strategy = new BestConnectedEverStrategy(this.substrategies);

    this.callback = jasmine.createSpy();
  });

  describe("on connect", function() {
    beforeEach(function() {
      this.strategy.connect(0, this.callback);
    });

    it("should call connect on all substrategies", function() {
      expect(this.substrategies[0].connect).toHaveBeenCalled();
      expect(this.substrategies[1].connect).toHaveBeenCalled();
      expect(this.substrategies[2].connect).toHaveBeenCalled();
    });

    describe("after establishing a connection", function() {
      var transport1;
      beforeEach(function() {
        transport1 = Mocks.getTransport();
        transport1.priority = 7;
        this.substrategies[0]._callback(null, { transport: transport1 });
      });

      it("should call back with first successful transport", function() {
        expect(this.callback).toHaveBeenCalledWith(null, {
          transport: transport1
        });
        expect(this.callback.calls.length).toEqual(1);
      });

      it("should force min priorities on all substrategies", function() {
        expect(this.substrategies[0]._forceMinPriority).toHaveBeenCalledWith(7);
        expect(this.substrategies[1]._forceMinPriority).toHaveBeenCalledWith(7);
        expect(this.substrategies[2]._forceMinPriority).toHaveBeenCalledWith(7);
      });

      it("should call back again if another substrategy succeeds", function() {
        var transport2 = Mocks.getTransport();
        transport2.priority = 19;

        this.substrategies[2]._callback(null, { transport: transport2 });

        expect(this.callback).toHaveBeenCalledWith(null, {
          transport: transport2
        });
        expect(this.callback.calls.length).toEqual(2);
      });
    });

    describe("on substrategy errors", function() {
      it("should pass an error after all substrategies failed", function() {
        this.substrategies[1]._callback(true);
        expect(this.callback).not.toHaveBeenCalled();
        this.substrategies[0]._callback(true);
        expect(this.callback).not.toHaveBeenCalled();
        this.substrategies[2]._callback(true);
        expect(this.callback).toHaveBeenCalledWith(true);
      });

      it("should not pass errors after one substrategy succeeded", function() {
        var transport = Mocks.getTransport();
        this.substrategies[0]._callback(null, { transport: transport });
        expect(this.callback.calls.length).toEqual(1);

        this.substrategies[1]._callback(true);
        expect(this.callback.calls.length).toEqual(1);
        this.substrategies[2]._callback(true);
        expect(this.callback.calls.length).toEqual(1);
      });
    });
  });

  describe("on abort", function() {
    it("should abort non-failed substrategies", function() {
      var runner = this.strategy.connect(0, this.callback);
      var transport = Mocks.getTransport();

      this.substrategies[1]._callback(true);
      this.substrategies[2]._callback(null, { transport: transport });
      runner.abort();

      expect(this.substrategies[0]._abort).toHaveBeenCalled();
      expect(this.substrategies[1]._abort).not.toHaveBeenCalled();
      expect(this.substrategies[2]._abort).toHaveBeenCalled();
    });
  });

  describe("on forceMinPriority", function() {
    it("should force the priority on all substrategies", function() {
      var runner = this.strategy.connect(0, this.callback);
      runner.forceMinPriority(991);
      expect(this.substrategies[0]._forceMinPriority).toHaveBeenCalledWith(991);
      expect(this.substrategies[1]._forceMinPriority).toHaveBeenCalledWith(991);
      expect(this.substrategies[2]._forceMinPriority).toHaveBeenCalledWith(991);
    });
  });
});
