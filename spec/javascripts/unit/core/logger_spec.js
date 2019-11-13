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

  // logToConsole should be disabled by default
  describe("with logToConsole == false", function() {
    it("should not log to the console", function() {
      Logger.debug("test", "this is a test");

      expect(_consoleLogCalls.length).toEqual(0);
      expect(_consoleWarnCalls.length).toEqual(0);
      expect(_consoleErrorCalls.length).toEqual(0);
    });

    it("should not warn to the console", function() {
      Logger.warn("test", "this is a test");

      expect(_consoleLogCalls.length).toEqual(0);
      expect(_consoleWarnCalls.length).toEqual(0);
      expect(_consoleErrorCalls.length).toEqual(0);
    });

    it("should not error to the console", function() {
      Logger.error("test", "this is a test");

      expect(_consoleLogCalls.length).toEqual(0);
      expect(_consoleWarnCalls.length).toEqual(0);
      expect(_consoleErrorCalls.length).toEqual(0);
    });
  });

  describe("with logToConsole == true", function() {
    beforeEach(function() {
      Pusher.logToConsole = true;
    })

    it("should log to the console", function() {
      Logger.debug("test", "this is a test");

      expect(_consoleLogCalls.length).toEqual(1);
      expect(_consoleWarnCalls.length).toEqual(0);
      expect(_consoleErrorCalls.length).toEqual(0);
    });

    it("should warn to the console", function() {
      Logger.warn("test", "this is a test");

      expect(_consoleLogCalls.length).toEqual(0);
      expect(_consoleWarnCalls.length).toEqual(1);
      expect(_consoleErrorCalls.length).toEqual(0);
    });

    it("should error to the console", function() {
      Logger.error("test", "this is a test");

      expect(_consoleLogCalls.length).toEqual(0);
      expect(_consoleWarnCalls.length).toEqual(0);
      expect(_consoleErrorCalls.length).toEqual(1);
    });

    describe("with console.error == undefined", function() {
      beforeEach(function() {
        global.console.error = undefined;
      })

      it("should fallback error logs to warn", function() {
        Logger.error("test", "this is a test");
    
        expect(_consoleLogCalls.length).toEqual(0);
        expect(_consoleWarnCalls.length).toEqual(1);
        expect(_consoleErrorCalls.length).toEqual(0);
      });

      describe("with console.warn == undefined", function() {
        beforeEach(function() {
          global.console.warn = undefined;
        })

        it("should fallback warn logs to log", function() {
          Logger.warn("test", "this is a test");
      
          expect(_consoleLogCalls.length).toEqual(1);
          expect(_consoleWarnCalls.length).toEqual(0);
          expect(_consoleErrorCalls.length).toEqual(0);
        });

        it("should fallback error logs to log", function() {
          Logger.error("test", "this is a test");
      
          expect(_consoleLogCalls.length).toEqual(1);
          expect(_consoleWarnCalls.length).toEqual(0);
          expect(_consoleErrorCalls.length).toEqual(0);
        });
      });
    });
  });
});
