// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

;(function(exports) {
  // UTILITY
  var pSlice = Array.prototype.slice;

  // 1. The assert module provides functions that throw
  // AssertionError's when particular conditions are not met. The
  // assert module must conform to the following interface.
  exports['assert'] = {}
  var assert = exports['assert'];

  assert.log = function(obj) {
    assert.log(obj);
  };
  
  assert.error = function(e) {
    assert.error(e);
  };

  // 2. The AssertionError is defined in assert.
  // new assert.AssertionError({ message: message,
  //                             actual: actual,
  //                             expected: expected })

  assert.AssertionError = function AssertionError(options) {
    this.name = 'AssertionError';
    this.message = options.message;
    this.actual = options.actual;
    this.expected = options.expected;
    this.operator = options.operator;
    var stackStartFunction = options.stackStartFunction;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, stackStartFunction);
    }

    this.toString = function() {
      if (this.message) {
        return [this.name + ':', this.message].join(' ');
      } else {
        // return this.name;
        //                 JSON.stringify(this.expected),
        //                 this.operator,
        //                 JSON.stringify(this.actual)].join(' ');
      }
    };
  };

  // assert.AssertionError instanceof Error
  assert.AssertionError.prototype = new Error();
  assert.AssertionError.constructor = assert.AssertionError;

  // At present only the three keys mentioned above are used and
  // understood by the spec. Implementations or sub modules can pass
  // other keys to the AssertionError's constructor - they will be
  // ignored.

  // 3. All of the following functions must throw an AssertionError
  // when a corresponding condition is not met, with a message that
  // may be undefined if not provided.  All assertion methods provide
  // both the actual and expected values to the assertion error for
  // display purposes.

  // EXTENSION! allows for well behaved errors defined elsewhere.
  function fail(actual, expected, message, operator, stackStartFunction) {
    var e =  new assert.AssertionError({
      message: message,
      actual: actual,
      expected: expected,
      operator: operator,
      stackStartFunction: stackStartFunction
    });

    assert.error('\tERROR: expected: ' + expected + ', actual: ' + actual);

    throw e;
  }

  assert.fail = fail;

  // 4. Pure assertion tests whether a value is truthy, as determined
  // by !!guard.
  // assert.ok(guard, message_opt);
  // This statement is equivalent to assert.equal(true, guard,
  // message_opt);. To test strictly for the value true, use
  // assert.strictEqual(true, guard, message_opt);.

  assert.ok = function ok(value, message) {
    if (!!!value) fail(value, true, message, '==', assert.ok);
  };

  // 5. The equality assertion tests shallow, coercive equality with
  // ==.
  // assert.equal(actual, expected, message_opt);

  assert.equal = function equal(actual, expected, message) {
    assert.log('\tTEST: ' + message);
    if (!isEqual(actual, expected)) {
      fail(actual, expected, message, '==', assert.equal);
    } else {
      assert.log('\tOK: ' + message);
    }
  };

  // 6. The non-equality assertion tests for whether two objects are not equal
  // with != assert.notEqual(actual, expected, message_opt);

  assert.notEqual = function notEqual(actual, expected, message) {
    if (!isEqual(actual, expected)) {
      fail(actual, expected, message, '!==', assert.notEqual);
    } else {
      assert.log('\tOK: ' + message);
    }
  };

  // 7. The equivalence assertion tests a deep equality relation.
  // assert.deepEqual(actual, expected, message_opt);

  assert.deepEqual = function deepEqual(actual, expected, message) {
    if (!isEqual(actual, expected)) {
      fail(actual, expected, message, 'deepEqual', assert.deepEqual);
    } else {
      assert.log('\tOK: ' + message);
    }
  };

  function isEqual(actual, expected) {
    return eq(actual, expected, []);
  }

  function isUndefinedOrNull(value) {
    return value === null || value === undefined;
  }

  function isArguments(object) {
    return Object.prototype.toString.call(object) == '[object Arguments]';
  }

  var ObjProto = Object.prototype;
  var toString = ObjProto.toString;
  var hasOwnProperty   = ObjProto.hasOwnProperty
  function isFunction(object) {
    return toString.call(object) == '[object Function]'
  }

  function eq(a, b, stack) {
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
            if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
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
            if (!(result = hasOwnProperty.call(b, key) && eq(a[key], b[key], stack))) break;
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

  // 8. The non-equivalence assertion tests for any deep inequality.
  // assert.notDeepEqual(actual, expected, message_opt);

  assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
    if (!isEqual(actual, expected)) {
      fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
    } else {
      assert.log('\tOK: ' + message);
    }
  };
})(this);