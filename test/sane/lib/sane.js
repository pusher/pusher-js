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

var isFunction = function(fn) {
  return (typeof fn === 'function');
}

var deepEqual = function(a, b, stack) {
  stack = stack || [];
  // Identical objects are equal. `0 === -0`, but they aren't identical.
  // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
  if (a === b) return a !== 0 || 1 / a == 1 / b;
  // A strict comparison is necessary because `null == undefined`.
  if (a == null || b == null) return a === b;
  // Unwrap any wrapped objects.
  if (a._chain) a = a._wrapped;
  if (b._chain) b = b._wrapped;
  // Invoke a custom `isEqual` method if one is provided.
  if (isFunction(a.isEqual)) return a.isEqual(b);
  if (isFunction(b.isEqual)) return b.isEqual(a);
  // Compare `[[Class]]` names.
  var className = toString.call(a);
  if (className != toString.call(b)) return false;
  switch (className) {
    // Strings, numbers, dates, and booleans are compared by value.
    case '[object String]':
      // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
      // equivalent to `new String("5")`.
      return String(a) == String(b);
    case '[object Number]':
      a = +a;
      b = +b;
      // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
      // other numeric values.
      return a != a ? b != b : (a == 0 ? 1 / a == 1 / b : a == b);
    case '[object Date]':
    case '[object Boolean]':
      // Coerce dates and booleans to numeric primitive values. Dates are compared by their
      // millisecond representations. Note that invalid dates with millisecond representations
      // of `NaN` are not equivalent.
      return +a == +b;
    // RegExps are compared by their source patterns and flags.
    case '[object RegExp]':
      return a.source == b.source &&
             a.global == b.global &&
             a.multiline == b.multiline &&
             a.ignoreCase == b.ignoreCase;
  }
  if (typeof a != 'object' || typeof b != 'object') return false;
  // Assume equality for cyclic structures. The algorithm for detecting cyclic
  // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
  var length = stack.length;
  while (length--) {
    // Linear search. Performance is inversely proportional to the number of
    // unique nested structures.
    if (stack[length] == a) return true;
  }
  // Add the first object to the stack of traversed objects.
  stack.push(a);
  var size = 0, result = true;
  // Recursively compare objects and arrays.
  if (className == '[object Array]') {
    // Compare array lengths to determine if a deep comparison is necessary.
    size = a.length;
    result = size == b.length;
    if (result) {
      // Deep compare the contents, ignoring non-numeric properties.
      while (size--) {
        // Ensure commutative equality for sparse arrays.
        if (!(result = size in a == size in b && deepEqual(a[size], b[size], stack))) break;
      }
    }
  } else {
    // Objects with different constructors are not equivalent.
    if ("constructor" in a != "constructor" in b || a.constructor != b.constructor) return false;
    // Deep compare objects.
    for (var key in a) {
      if (hasOwnProperty.call(a, key)) {
        // Count the expected number of properties.
        size++;
        // Deep compare each member.
        if (!(result = hasOwnProperty.call(b, key) && deepEqual(a[key], b[key], stack))) break;
      }
    }
    // Ensure that both objects contain the same number of properties.
    if (result) {
      for (key in b) {
        if (hasOwnProperty.call(b, key) && !(size--)) break;
      }
      result = !size;
    }
  }
  // Remove the first object from the stack of traversed objects.
  stack.pop();
  return result;
}

var near = function(a, b, tolerance) {
  return (Math.abs(a - b) < tolerance);
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
  var start_time = +new Date;
  suite.run(self, function(err) {
    cb(err, ((+new Date) - start_time)/1000);
  });
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

TestCaseRunner.prototype.equal = function(a, b, msg, cb) {
  var self = this;
  self.ok(a===b, msg, cb);
}

TestCaseRunner.prototype.deepEqual = function(a, b, msg, cb) {
  var self = this;
  self.ok(deepEqual(a, b), JSON.stringify(a) + " !== " + JSON.stringify(b) + ", " + msg, cb);
}

TestCaseRunner.prototype.near = function(a, b, tolerance, msg, cb) {
  var self = this;
  self.ok(near(a, b, tolerance), "expected " + a + ", got " + b + " (with a tolerance of " + tolerance + ")");
}

TestCaseRunner.prototype.ok = function(cnd, msg, cb) {
  var self = this;
  if (!cnd) {
    self.fail(msg);
  } else if (cb) {
    cb();
  }
}

// A single test case
var TestCase = function(name, fn, timeout) {
  var self = this;
  self.name = name;
  self.fn = fn;
  self.timeout = timeout || 100000;
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
    if (isFunction(suite[key])) {
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
