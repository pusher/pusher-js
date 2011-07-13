;(function(module) {
  exports = module['testing'] = {};

var process = {
  on: function() {},
  removeListener: function() {},
  exit: function() {},
  nextTick: function(cb) {
    setTimeout(cb, 0);
  }
};
var inspect = function(){}; // require('util').inspect

/* Runs an object with tests.  Each property in the object should be a
 * test.  A test is just a method.
 *
 * Available configuration options:
 *
 * + parallel: boolean, for whether or not the tests should be run in parallel
 *             or serially.  Obviously, parallel is faster, but it doesn't give
 *             as accurate error reporting
 * + testName: string or array of strings, the name of a test to be ran
 * + name:     string, the name of the suite being ran
 *
 * Plus, there are options for the following events. These should be functions.
 * See docs/running-tests.html for a description of these events.
 *
 * + onTestStart
 * + onTestDone
 * + onSuiteDone
 */
exports.runSuite = function(obj, options) {
  // make sure options exists
  options = options || {};

  // keep track of internal state
  var suite =
    { todo: exports.getTestsFromObject(obj, options.testName)
    , started: []
    , results: []
    }

  // console.log('-----')
  // console.log(exports.getTestsFromObject(obj, options.testName))
  // console.log('-----')
  if(options.beforeStartSuite) options.beforeStartSuite(suite.todo);

  if (suite.todo.length < 1) { return suiteFinished(); }

  process.on('uncaughtException', errorHandler);
  process.on('exit', exitHandler);

  // start the test chain
  startNextTest();

  /******** functions ********/

  function startNextTest() {
    var test = suite.todo.shift();

    if (!test) { return; }

    suite.started.push(test);

    // make sure all tests are an array of test functions
    test.func = Array.isArray(test.func) ? test.func : [test.func];
    // TODO make sure test length is odd?

    // keep track of which parts of the flow have been run
    test.history = [];
    // keep track of assertions made:
    test.numAssertions = 0;
    // object that is passed to the tests:
    test.obj =
      { get uncaughtExceptionHandler() { return test.UEHandler; }
      , set uncaughtExceptionHandler(h) {
          if (options.parallel) {
            test.obj.equal('serial', 'parallel',
               "Cannot set an 'uncaughtExceptionHandler' when running tests in parallel");
          }
          test.UEHandler = h;
        }
      , finish: function() {
          testProgressed(test);
        }
      };

    addAssertionFunctions(test);

    if (options.onTestStart) { options.onTestStart(test.name); }

    runTestFunc(test);

    // if we are supposed to run the tests in parallel, start the next test
    // if (options.parallel) {
    //   process.nextTick(function() {
    //     startNextTest();
    //   });
    // }
  }

  function runTestFunc(test) {
    try {
      var index = test.history.length;
      // mark that we ran the next step
      test.history.push(true);
      // run the first function
      test.func[index](test.obj, test.obj.finish);
    }
    catch(err) {
      errorHandler(err, test);
    }
  }

  // used when tests are ran, adds the assertion functions to a test object, but
  // binds them to that particular test so assertions are properly associated with
  // the right test.
  function addAssertionFunctions(test) {
    for (var funcName in assertionFunctions) {
      (function() {
        var fn = funcName;
        test.obj[fn] = function() {
          // if the test doesn't have a func, it was already finished
          if (!test.func) {
            testAlreadyFinished(test, 'Encountered ' + fn + ' assertion');
          }
          try {
            assertionFunctions[fn].apply(null, arguments);
            test.numAssertions++;
          }
          catch(err) {
            if (err instanceof assert.AssertionError) {
              err.TEST = test;
            }
            throw err;
          }
        }
      })();
    };
  }

  function testAlreadyFinished(test, msg) {
    errorHandler(new TestAlreadyFinishedError(test.name + ' already finished!' + (msg ? ' ' + msg : '')), test);
  }

  // this is called after each step in a test (each function in the array).
  // it figures out what the next step should be and does it
  //
  // steps come in pairs (except for one middle function), where if the first
  // member in a pair is ran then we need to run the second member,
  //
  // so if the pairs are for setup/teardown (which is what this feature is
  // writen for) if a setup is ran, then its corresponding teardown is ran
  // regardless of whether the test passes.  So, if you start a server or
  // something, you can be sure it is stopped.
  function testProgressed(test, problem) {
    // only keep the first failure that arises in a test
    if (!test.failure && problem) {
      test.failure = problem;
    }

    if (test.func.length == test.history.length) {
      testFinished(test);
    }
    else {
      var index = test.history.length;
      var match = test.func.length - index - 1;

      if (match >= index) {
        // we are still drilling down into the flow, not doing teardowns
        if (test.failure) {
          // we had a failure, so we don't start any new functions
          test.history.push(false);
          testProgressed(test);
        }
        else {
          // no failure yet, start next step
          runTestFunc(test);
        }
      }
      else {
        // we are doing teardowns.  We always run a teardown function if its
        // matching setup was run
        if (test.history[match]) {
          // according to the history we ran the match
          runTestFunc(test);
        }
        else {
          // didn't run the match so don't run this
          test.history.push(false);
          testProgressed(test);
        }
      }
    }
  }

  function testFinished(test, problem) {
    if (!test.failure
        && test.obj.numAssertions
        && test.obj.numAssertions != test.numAssertions) {
      // if they specified the number of assertions, make sure they match up
      test.failure = new assert.AssertionError(
         { message: 'Wrong number of assertions: ' + test.numAssertions +
                    ' != ' + test.obj.numAssertions
         , actual: test.numAssertions
         , expected: test.obj.numAssertions
         });
    }

    if (test.failure) {
      test.failureType = test.failure instanceof assert.AssertionError ? 'assertion' : 'error';
      delete test.numAssertions;
    }

    // remove it from the list of tests that have been started
    suite.started.splice(suite.started.indexOf(test), 1);

    test.obj.finish = function() {
      testAlreadyFinished(test);
    }
    // clean up properties that are no longer needed
    delete test.obj;
    delete test.history;
    delete test.func;

    suite.results.push(test);

    if (options.onTestDone) { options.onTestDone(test.failure ? 'failure' : 'success', test); }

    process.nextTick(function() {
      // if we have no more tests to start and none still running, we're done
      if (suite.todo.length == 0 && suite.started.length == 0) {
        suiteFinished();
      }

     startNextTest();
    });
  }

  function errorHandler(err, test) {
    // assertions throw an error, but we can't just catch those errors, because
    // then the rest of the test will run.  So, we don't catch it and it ends up
    // here. When that happens just finish the test.

    if (err instanceof assert.AssertionError && err.TEST) {
      var t = err.TEST;
      delete err.TEST;
      return testProgressed(t, err);
    }

    // if the error is not an instance of Error (& has no stack trace) wrap in proper error

    if('object' !== typeof err)
      err = new Error (typeof err + " thrown:" + inspect(err) + " (intercepted by async_testing)")

    // We want to allow tests to supply a function for handling uncaught errors,
    // and since all uncaught errors come here, this is where we have to handle
    // them.
    // (you can only handle uncaught errors when not in parallel mode)
    if (!options.parallel && suite.started.length && suite.started[0].UEHandler) {
      // an error could possibly be thrown in the UncaughtExceptionHandler, in
      // this case we do not want to call the handler again, so we move it
      suite.started[0].UEHandlerUsed = suite.started[0].UEHandler;
      delete suite.started[0].UEHandler;

      try {
        // run the UncaughtExceptionHandler
        suite.started[0].UEHandlerUsed(err);
        return;
      }
      catch(e) {
        // we had an error, just run our error handler function on this error
        // again.  We don't have to worry about it triggering the uncaught
        // exception handler again because we moved it just a second ago
        return errorHandler(e);
      }
    }

    if (!(err instanceof TestAlreadyFinishedError) && (test || suite.started.length == 1)) {
      // if we can narrow down what caused the error then report it
      test = test || suite.started[0];
      testProgressed(test, err);
    }
    else {
      // otherwise report that we can't narrow it down and exit
      process.removeListener('uncaughtException', errorHandler);
      process.removeListener('exit', exitHandler);

      if (options.onSuiteDone) {
        var tests = test ? [test] : suite.started;
        if (tests.length < 1) {
          tests = suite.results;
        }
        options.onSuiteDone('error', { error: err, tests: tests.map(function(t) { return t.name; })});
        process.exit(1);
      }
      else {
        // TODO test this
        throw err;
      }
    }
  }

  function exitHandler() {
    if (suite.started.length > 0) {
      if (options.onSuiteDone) {
        options.onSuiteDone('exit', {tests: suite.started.map(function(t) { return t.name; })});
      }
    }
  }

  // clean up method which notifies all listeners of what happened
  function suiteFinished() {
    if (suite.finished) { return; }

    suite.finished = true;

    process.removeListener('uncaughtException', errorHandler);
    process.removeListener('exit', exitHandler);

    if (options.onSuiteDone) {
      var result =
        { tests: suite.results
        , numFailures: 0
        , numSuccesses: 0
        };


      suite.results.forEach(function(r) {
        result[r.failure ? 'numFailures' : 'numSuccesses']++;
      });

      options.onSuiteDone('complete', result);
    }
  }
}

// store the assertion functions available to tests
var assertionFunctions = {};

// this allows people to add custom assertion functions.
//
// An assertion function needs to throw an error that is `instanceof
// assert.AssertionError` so it is possible to distinguish between runtime
// errors and failures. I recommend the `assert.fail` method.
exports.registerAssertion = function(name, func) {
  assertionFunctions[name] = func;
}

// register the default functions
var assertionModuleAssertions = [ 'ok', 'equal', 'notEqual', 'deepEqual', 'notDeepEqual', 'strictEqual', 'notStrictEqual', 'throws', 'doesNotThrow', 'ifError'];
assertionModuleAssertions.forEach(function(funcName) {
    exports.registerAssertion(funcName, assert[funcName]);
  });

// this is a recursive function because suites can hold sub suites
exports.getTestsFromObject = function(o, filter, namespace) {
  var tests = [];
  for(var key in o) {
    (function(key, value) {
      var displayName = (namespace ? namespace+' \u2192 ' : '') + key;
      if (typeof value == 'function' || Array.isArray(value)) {
        // if the testName option is set, then only add the test to the todo
        // list if the name matches
        if (!filter || filter.indexOf(key) >= 0) {
          tests.push({
            name: displayName,
            func: value
          });
        }
      }
      else {
        tests = tests.concat(exports.getTestsFromObject(value, filter, displayName));
      }
    })(key, o[key]);
  }

  return tests;
}

var messageFrame = "~m~";
// these encode/decode functions inspired by socket.io's
exports.messageDecode = function(lines) {
  return lines.map(function(str) {
    if (str.substr(0,3) !== messageFrame) {
      return str;
    }

    var msg = [];
    for (var i = 3, number = '', l = str.length; i < l; i++){
      var n = Number(str.substr(i, 1));
      if (str.substr(i, 1) == n){
        number += n;
      } else {
        number = Number(number);
        var m = str.substr(i+messageFrame.length, number);
        msg.push(JSON.parse(m));
        i += messageFrame.length*2 + number - 1;
        number = '';
      }
    }
    return msg;
  });
}
exports.messageEncode = function() {
  var r = '';

  for (var i = 0; i < arguments.length; i++) {
    var json = JSON.stringify(arguments[i]);
    r += messageFrame + json.length + messageFrame + json;
  }

  return r;
}

var TestAlreadyFinishedError = function(message) {
  this.name = "TestAlreadyFinishedError";
  this.message = message;
  Error.captureStackTrace(this);
};
TestAlreadyFinishedError.__proto__ = Error.prototype;

})(this)