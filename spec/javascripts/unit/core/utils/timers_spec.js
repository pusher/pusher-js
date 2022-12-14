var timers = require('core/utils/timers');

describe("timers", function() {
  describe("Timer", function() {
    var callback;
    var timer;

    beforeEach(function() {
      jasmine.clock().uninstall();
      jasmine.clock().install();

      callback = jasmine.createSpy("callback");
      timer = new timers.OneOffTimer(123, callback);
    });

    afterEach(function() {
      timer.ensureAborted();
      jasmine.clock().uninstall();
    });

    it("should execute the callback with the specified delay", function() {
      expect(callback).not.toHaveBeenCalled();
      jasmine.clock().tick(122);
      expect(callback).not.toHaveBeenCalled();
      jasmine.clock().tick(1);
      expect(callback).toHaveBeenCalled();
    });

    it("should execute the callback exactly once", function() {
      jasmine.clock().tick(1000);
      expect(callback.calls.count()).toEqual(1);
    });

    describe("#isRunning", function() {
      it("should return true before execution", function() {
        jasmine.clock().tick(122);
        expect(timer.isRunning()).toBe(true);
      });

      it("should return false after execution", function() {
        jasmine.clock().tick(123);
        expect(timer.isRunning()).toBe(false);
      });

      it("should return false after aborting", function() {
        timer.ensureAborted();
        expect(timer.isRunning()).toBe(false);
      });
    });

    describe("#ensureAborted", function() {
      it("should abort the timer before execution", function() {
        timer.ensureAborted();
        jasmine.clock().tick(1000);
        expect(callback).not.toHaveBeenCalled();
      });

      it("should play nice after execution", function() {
        jasmine.clock().tick(1000);
        timer.ensureAborted();
      });

      it("should stop callback from being called even if clearTimeout is broken", function() {
        // IE has some edge-case with clearTimeout not working, let's simulate it
        let _clearTimeout = global.clearTimeout;
        spyOn(global, "clearTimeout");
        timer.ensureAborted();
        jasmine.clock().tick(1000);
        expect(callback).not.toHaveBeenCalled();
        global.clearTimeout = _clearTimeout;
      });
    });
  });

  describe("PeriodicTimer", function() {
    var callback;
    var timer;

    beforeEach(function() {
      jasmine.clock().uninstall();
      jasmine.clock().install();

      callback = jasmine.createSpy("callback");
      timer = new timers.PeriodicTimer(123, callback);
    });

    afterEach(function() {
      timer.ensureAborted();
      jasmine.clock().uninstall();
    });

    it("should execute the callback with the specified delay", function() {
      expect(callback).not.toHaveBeenCalled();
      jasmine.clock().tick(122);
      expect(callback).not.toHaveBeenCalled();
      jasmine.clock().tick(1);
      expect(callback).toHaveBeenCalled();
    });

    it("should execute the callback periodically", function() {
      jasmine.clock().tick(123);
      expect(callback.calls.count()).toEqual(1);
      jasmine.clock().tick(123);
      expect(callback.calls.count()).toEqual(2);
    });

    describe("#isRunning", function() {
      it("should return true before execution", function() {
        jasmine.clock().tick(122);
        expect(timer.isRunning()).toBe(true);
      });

      it("should return true after execution", function() {
        jasmine.clock().tick(123);
        expect(timer.isRunning()).toBe(true);
      });

      it("should return false after aborting", function() {
        timer.ensureAborted();
        expect(timer.isRunning()).toBe(false);
      });
    });

    describe("#ensureAborted", function() {
      it("should abort the timer before execution", function() {
        timer.ensureAborted();
        jasmine.clock().tick(1000);
        expect(callback).not.toHaveBeenCalled();
      });

      it("should abort the timer after first execution", function() {
        jasmine.clock().tick(123);
        expect(callback.calls.count()).toEqual(1);
        timer.ensureAborted();
        jasmine.clock().tick(1000);
        expect(callback.calls.count()).toEqual(1);
      });

      it("should be idempotent", function() {
        timer.ensureAborted();
        timer.ensureAborted();
        jasmine.clock().tick(1000);
        expect(callback).not.toHaveBeenCalled();
      });

      it("should stop callback from being called even if clearTimeout is broken", function() {
        // IE has some edge-case with clearTimeout not working, let's simulate it
        let _clearTimeout = global.clearTimeout;
        spyOn(global, "clearTimeout");
        timer.ensureAborted();
        jasmine.clock().tick(1000);
        expect(callback).not.toHaveBeenCalled();
        global.clearTimeout = _clearTimeout;
      });
    });
  });
});
