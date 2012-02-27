// Utility Functions

// Partially apply an argument to a function
var partial = function(fn, arg) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    return fn.apply(null, [arg].concat(args));
  }
}

// Given an array of functions that take a callback, run them in sequence
var sequence = function(items) {
  var sequence_ = function(cbs) {
    var fn = cbs.pop();
    if (fn) {
      fn(partial(sequence_, cbs));
    }
  }
  sequence_(items.slice().reverse());
}

var mapSync = function(fn, items) {
  var output = [];
  for (var i = 0; i < items.length; i++) {
    output.push(fn(items[i]))
  }
  return output;
}

var curry = function(fn) {
  return function(i) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      return fn.apply(null, [i].concat(args));
    }
  }
}

var forEachAsync = function(fn, items, cb) {
  sequence(mapSync(curry(fn), items).concat([cb]));
}

// Main Objects

// Top level object
var TestSuiteRunner = function(logger) {
  var self = this;
  self.logger = logger;
  self.path = [];
}

// Run a test suite/case
TestSuiteRunner.prototype.run = function(suite, cb) {
  var self = this;
  suite.run(self, cb);
}

TestSuiteRunner.prototype.descend = function(name) {
  var self = this;
  self.path.push(name);
}

TestSuiteRunner.prototype.ascend = function() {
  var self = this;
  self.path.pop();
}

TestSuiteRunner.prototype.current_path = function() {
  var self = this;
  return self.path.join('/');
}

TestSuiteRunner.prototype.log_error = function(err) {
  var self = this;
  self.logger.log(self.current_path() + ": failed irrecoverably with: " + err);
}

TestSuiteRunner.prototype.log_failure = function(reason) {
  var self = this;
  if (reason) {
    self.logger.log(self.current_path() + ": failed with: \"" + reason + "\"");
  } else {
    self.logger.log(self.current_path() + ": failed");
  }
}

TestSuiteRunner.prototype.log_success = function() {
  var self = this;
  self.logger.log(self.current_path() + ": succeeded");
}

// The object passed into a test case
var TestCaseRunner = function(timeout, suite_runner, cb) {
  var self = this;
  self.finished = false;
  self.cb = cb;
  self.suite_runner = suite_runner;
  self.timeout = setTimeout(function() {
    if (!self.finished) {
      self.finished = true;
      suite_runner.log_error('test timeout');
      self.cb('test timeout');
    }
  }, timeout);
}

TestCaseRunner.prototype.fail = function(reason) {
  var self = this;
  clearTimeout(self.timeout);
  if (!self.finished) {
    self.finished = true;
    self.suite_runner.log_failure(reason);
    self.cb();
  }
}

TestCaseRunner.prototype.done = function() {
  var self = this;
  clearTimeout(self.timeout);
  if (!self.finished) {
    self.finished = true;
    self.suite_runner.log_success();
    self.cb();
  }
}

TestCaseRunner.prototype.finish = function() {
  var self = this;
  self.done();
}

TestCaseRunner.prototype.equal = function(a, b) {
  var self = this;
  if (a !== b) {
    self.fail();
  }
}

TestCaseRunner.prototype.ok = function(cnd) {
  if (!cnd) {
    self.fail();
  }
}

// A single test case
var TestCase = function(name, fn, timeout) {
  var self = this;
  self.name = name;
  self.fn = fn;
  self.timeout = timeout || 1000;
}

TestCase.prototype.run = function(suite_runner, cb) {
  var self = this;
  suite_runner.descend(self.name);
  self.fn(new TestCaseRunner(self.timeout, suite_runner, function(err) {
    suite_runner.ascend();
    cb(err);
  }));
}

// A suite of test cases and test suites
var TestSuite = function(name, suites) {
  var self = this;
  self.name = name;
  self.suites = suites || [];
}

// Add a test case/suite after creation
TestSuite.prototype.add = function(suite) {
  var self = this;
  self.suites.push(suite);
}

TestSuite.prototype.addCase = function(name, fn) {
  var self = this;
  self.add(new TestCase(name, fn))
}

// Convenience function
TestSuite.prototype.addSuite = function(name, suite) {
  var self = this;
  var ts = new TestSuite(name)
  self.add(ts)
  for (var key in suite) {
    if (typeof suite[key] == 'function') {
      ts.addCase(key, suite[key])
    } else {
      ts.addSuite(key, suite[key])
    }
  }
}

// Run everything (don't invoke directly, use a TestSuiteRunner)
TestSuite.prototype.run = function(suite_runner, run_cb) {
  var self = this;
  suite_runner.descend(self.name);
  forEachAsync(function(suite, next) {
    suite.run(suite_runner, function(err) {
      if (err) {
        run_cb(err);
      } else {
        next();
      }
    })
  }, self.suites, function() {
    suite_runner.ascend();
    run_cb();
  });
}

Tests = new TestSuite("");
