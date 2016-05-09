var Pusher = require('core/pusher').default;
var Logger = require('core/logger').default;
var global = Function("return this")();

describe("Pusher.logToConsole", function() {

  var _nativeConsoleLog;
  var _consoleLogCalls;

  beforeEach(function() {
    _consoleLogCalls = [];

    _nativeConsoleLog = global.console.log;
    global.console.log = function() {
      _consoleLogCalls.push(arguments);
    };
  });

  afterEach(function() {
    global.console.log = _nativeConsoleLog;
  });

  it("should be disabled by default", function() {
    expect(Pusher.logToConsole).toEqual(false);
  });

  it("should not log to the console if set to false", function() {
    Logger.warn("test", "this is a test");

    expect(_consoleLogCalls.length).toEqual(0);
  });

  it("should log to the console if set to true", function() {
    Pusher.logToConsole = true;
    Logger.warn("test", "this is a test");

    expect(_consoleLogCalls.length).toBeGreaterThan(0);
  });
});
