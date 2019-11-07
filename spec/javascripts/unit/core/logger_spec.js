var Pusher = require('core/pusher').default;
var Logger = require('core/logger').default;
var global = Function("return this")();

describe("Logger", function() {

  var _nativeConsoleLog;
  var _nativeConsoleWarn;
  var _nativeConsoleError;
  var _consoleLogCalls;
  var _consoleWarnCalls;
  var _consoleErrorCalls;

  beforeEach(function() {
    _consoleLogCalls = [];
    _consoleWarnCalls = [];
    _consoleErrorCalls = [];

    _nativeConsoleLog = global.console.log;
    _nativeConsoleWarn = global.console.warn;
    _nativeConsoleError = global.console.error;

    global.console.log = function() {
      _consoleLogCalls.push(arguments);
    };
    global.console.warn = function() {
      _consoleWarnCalls.push(arguments);
    };
    global.console.error = function() {
      _consoleErrorCalls.push(arguments);
    };
  });

  afterEach(function() {
    global.console.log = _nativeConsoleLog;
    global.console.warn = _nativeConsoleWarn;
    global.console.error = _nativeConsoleError;
  });

  it("logToConsole should be disabled by default", function() {
    expect(Pusher.logToConsole).toEqual(false);
  });

  it("should not log to the console if logToConsole set to false", function() {
    Logger.debug("test", "this is a test");
    Logger.warn("test", "this is a test");
    Logger.error("test", "this is a test");

    expect(_consoleLogCalls.length).toEqual(0);
    expect(_consoleWarnCalls.length).toEqual(0);
    expect(_consoleErrorCalls.length).toEqual(0);
  });

  it("should log to the console if logToConsole set to true", function() {
    Pusher.logToConsole = true;
    Logger.debug("test", "this is a test");
    Logger.warn("test", "this is a test");
    Logger.error("test", "this is a test");

    expect(_consoleLogCalls.length).toEqual(1);
    expect(_consoleWarnCalls.length).toEqual(1);
    expect(_consoleErrorCalls.length).toEqual(1);
  });

  it("should fallback to warn if error not available when logging error", function() {
    Pusher.logToConsole = true;
    global.console.error = undefined;

    Logger.error("test", "this is a test");

    expect(_consoleLogCalls.length).toEqual(0);
    expect(_consoleWarnCalls.length).toEqual(1);
    expect(_consoleErrorCalls.length).toEqual(0);
  });

  it("should fallback to log if error and warn not available when logging error", function() {
    Pusher.logToConsole = true;
    global.console.error = undefined;
    global.console.warn = undefined;

    Logger.error("test", "this is a test");

    expect(_consoleLogCalls.length).toEqual(1);
    expect(_consoleWarnCalls.length).toEqual(0);
    expect(_consoleErrorCalls.length).toEqual(0);
  });

  it("should fallback to log if warn not available when logging warn", function() {
    Pusher.logToConsole = true;
    global.console.warn = undefined;

    Logger.warn("test", "this is a test");

    expect(_consoleLogCalls.length).toEqual(1);
    expect(_consoleWarnCalls.length).toEqual(0);
    expect(_consoleErrorCalls.length).toEqual(0);
  });
});
