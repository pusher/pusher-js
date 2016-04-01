var Pusher = require('core/pusher');
var Logger = require('core/logger').default;

describe("Pusher.logToConsole", function() {

  var _nativeConsoleLog;
  var _consoleLogCalls;

  beforeEach(function() {
    _consoleLogCalls = [];

    _nativeConsoleLog = window.console.log;
    window.console.log = function() {
      _consoleLogCalls.push(arguments);
    };
  });

  afterEach(function() {
    window.console.log = _nativeConsoleLog;
  });

  it("should be disabled by default", function() {
    expect(Logger.log).toBe(null);
  });

  it("should not log to the console if set to false", function() {
    Logger.warn("test", "this is a test");

    expect(_consoleLogCalls.length).toEqual(0);
  });

  it("should log to the console if set to true", function() {
    Pusher.logToConsole();
    Logger.warn("test", "this is a test");

    expect(_consoleLogCalls.length).toBeGreaterThan(0);
  });
});
