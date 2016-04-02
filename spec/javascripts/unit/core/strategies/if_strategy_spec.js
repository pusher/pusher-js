var Mocks = require("mocks");

var IfStrategy = require('core/strategies/if_strategy').default;

describe("IfStrategy", function() {
  var test, trueBranch, falseBranch;
  var callback;

  beforeEach(function() {
    trueBranch = Mocks.getStrategy(true);
    falseBranch = Mocks.getStrategy(true);
    callback = jasmine.createSpy();
  });

  describe("when the test is true", function() {
    var strategy;

    beforeEach(function() {
      test = function() { return true; };
      strategy = new IfStrategy(test, trueBranch, falseBranch);
    });

    describe("#isSupported", function() {
      it("should return true if the 'true' branch is supported", function() {
        trueBranch = Mocks.getStrategy(true);
        falseBranch = Mocks.getStrategy(false);
        var strategy = new IfStrategy(
          test, trueBranch, falseBranch
        );
        expect(strategy.isSupported()).toBe(true);
      });

      it("should return false if the 'true' branch is not supported", function() {
        trueBranch = Mocks.getStrategy(false);
        falseBranch = Mocks.getStrategy(true);
        var strategy = new IfStrategy(
          test, trueBranch, falseBranch
        );
        expect(strategy.isSupported()).toBe(false);
      });
    });

    describe("#connect", function() {
      beforeEach(function() {
        strategy.connect(0, callback);
      });

      it("should connect using the 'true' branch", function() {
        expect(trueBranch.connect).toHaveBeenCalled();
        expect(falseBranch.connect).not.toHaveBeenCalled();
      });

      it("should connect with correct priority using the 'true' branch", function() {
        strategy.connect(5, callback);
        expect(trueBranch.connect)
          .toHaveBeenCalledWith(5, jasmine.any(Function));
      });

      it("should call back with a connection after the 'true' branch succeeds", function() {
        var handshake = {};
        trueBranch._callback(null, handshake);
        expect(callback).toHaveBeenCalledWith(null, handshake);
      });

      it("should call back with an error when the 'true' branch fails", function() {
        trueBranch._callback("boom");
        expect(callback).toHaveBeenCalledWith("boom");
      });
    });

    describe("with a runner returned from #connect", function() {
      var runner;

      beforeEach(function() {
        runner = strategy.connect(0, callback);
      });

      it("should abort the attempt from the 'true' branch", function() {
        runner.abort();
        expect(trueBranch._abort).toHaveBeenCalled();
      });

      it("should force priority on the attempt from the 'true' branch", function() {
        runner.forceMinPriority(42);
        expect(trueBranch._forceMinPriority).toHaveBeenCalledWith(42);
      });
    });
  });

  describe("when the test is false", function() {
    var strategy;

    beforeEach(function() {
      test = function() { return false; };
      strategy = new IfStrategy(test, trueBranch, falseBranch);
    });

    describe("after calling isSupported", function() {
      it("should return true if the 'false' branch is supported", function() {
        trueBranch = Mocks.getStrategy(false);
        falseBranch = Mocks.getStrategy(true);
        var strategy = new IfStrategy(
          test, trueBranch, falseBranch
        );
        expect(strategy.isSupported()).toBe(true);
      });

      it("should return false if the 'false' branch is not supported", function() {
        trueBranch = Mocks.getStrategy(true);
        falseBranch = Mocks.getStrategy(false);
        var strategy = new IfStrategy(
          test, trueBranch, falseBranch
        );
        expect(strategy.isSupported()).toBe(false);
      });
    });

    describe("#connect", function() {
      it("should connect using the 'false' branch", function() {
        strategy.connect(0, callback);
        expect(falseBranch.connect).toHaveBeenCalled();
        expect(trueBranch.connect).not.toHaveBeenCalled();
      });

      it("should connect with correct priority using the 'false' branch", function() {
        strategy.connect(111, callback);
        expect(falseBranch.connect)
          .toHaveBeenCalledWith(111, jasmine.any(Function));
      });

      it("should call back with a connection after the 'false' branch succeeds", function() {
        strategy.connect(0, callback);

        var handshake = {};
        falseBranch._callback(null, handshake);
        expect(callback).toHaveBeenCalledWith(null, handshake);
      });

      it("should call back with an error when the 'false' branch fails", function() {
        strategy.connect(0, callback);

        falseBranch._callback("boom");
        expect(callback).toHaveBeenCalledWith("boom");
      });
    });

    describe("with a runner returned from #connect", function() {
      var runner;

      beforeEach(function() {
        runner = strategy.connect(0, callback);
      });

      it("should abort the attempt from the 'false' branch", function() {
        runner.abort();
        expect(falseBranch._abort).toHaveBeenCalled();
      });

      it("should force priority on the attempt from the 'false' branch", function() {
        runner.forceMinPriority(42);
        expect(falseBranch._forceMinPriority).toHaveBeenCalledWith(42);
      });
    });
  });
});
