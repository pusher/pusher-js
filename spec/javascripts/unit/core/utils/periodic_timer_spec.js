var Timers = require('core/utils/timers');
var PeriodicTimer = Timers.PeriodicTimer;

describe("PeriodicTimer", function() {
  var callback;
  var timer;

  beforeEach(function() {
    jasmine.clock().uninstall();
    jasmine.clock().install();

    callback = jasmine.createSpy("callback");
    timer = new PeriodicTimer(123, callback);
  });

  afterEach(function() {
    timer.ensureAborted();
    jasmine.clock().uninstall();
  });

  it("should keep executing the callback with the specified interval", function() {
    expect(callback.calls.count()).toEqual(0);
    jasmine.clock().tick(122);
    expect(callback.calls.count()).toEqual(0);
    jasmine.clock().tick(1);
    expect(callback.calls.count()).toEqual(1);

    expect(callback.calls.count()).toEqual(1);
    jasmine.clock().tick(122);
    expect(callback.calls.count()).toEqual(1);
    jasmine.clock().tick(1);
    expect(callback.calls.count()).toEqual(2);
  });

  describe("#isRunning", function() {
    it("should return true before first execution", function() {
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
      jasmine.clock().tick(1000000);
      expect(callback).not.toHaveBeenCalled();
    });

    it("should play nice after first execution", function() {
      jasmine.clock().tick(1000);
      timer.ensureAborted();
    });

    it("should stop callback from being called even if clearInterval is broken", function() {
      // IE has some edge-case with clearInterval not working, let's simulate it
      let _clearInterval = global.clearInterval;
      spyOn(global, "clearInterval").and.callThrough();
      timer.ensureAborted();
      jasmine.clock().tick(1000);
      expect(callback).not.toHaveBeenCalled();
      global.clearInterval = _clearInterval;
    });
  });
});
