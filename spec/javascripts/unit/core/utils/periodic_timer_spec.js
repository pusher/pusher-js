var Timers = require('core/utils/timers');
var PeriodicTimer = Timers.PeriodicTimer;

describe("PeriodicTimer", function() {
  var callback;
  var timer;

  beforeEach(function() {
    jasmine.Clock.useMock();

    callback = jasmine.createSpy("callback");
    timer = new PeriodicTimer(123, callback);
  });

  afterEach(function() {
    timer.ensureAborted();
  });

  it("should keep executing the callback with the specified interval", function() {
    expect(callback.calls.length).toEqual(0);
    jasmine.Clock.tick(122);
    expect(callback.calls.length).toEqual(0);
    jasmine.Clock.tick(1);
    expect(callback.calls.length).toEqual(1);

    expect(callback.calls.length).toEqual(1);
    jasmine.Clock.tick(122);
    expect(callback.calls.length).toEqual(1);
    jasmine.Clock.tick(1);
    expect(callback.calls.length).toEqual(2);
  });

  describe("#isRunning", function() {
    it("should return true before first execution", function() {
      jasmine.Clock.tick(122);
      expect(timer.isRunning()).toBe(true);
    });

    it("should return true after execution", function() {
      jasmine.Clock.tick(123);
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
      jasmine.Clock.tick(1000000);
      expect(callback).not.toHaveBeenCalled();
    });

    it("should play nice after first execution", function() {
      jasmine.Clock.tick(1000);
      timer.ensureAborted();
    });

    it("should stop callback from being called even if clearInterval is broken", function() {
      // IE has some edge-case with clearInterval not working, let's simulate it
      spyOn(global, "clearInterval");
      timer.ensureAborted();
      jasmine.Clock.tick(1000);
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
