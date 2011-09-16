  /*-----------------------------------------------
    TestRunner
  -----------------------------------------------*/
  // internals:
  var hasNativeForEach = (Array.prototype.forEach && typeof Array.prototype.forEach == 'function');

  // Utilities:
  function forEach(array, callbackfn, thisArg) {
    if (hasNativeForEach) {
      array.forEach(callbackfn, thisArg);
    } else {
      for (var k=0, len=array.length; k<len;) {
        callbackfn.call(thisArg, array[k], k, array);
        k++;
      }
    }
  }

  function TestRunner() {
    // storage:
    this.suites = [];
    this.suite_names = [];

    this.totals = {
      failures: 0,
      successes: 0,
      count: 0,
      suitesRun: 0
    };
  }

  TestRunner.prototype.addSuite = function(name, tests) {
    if (this.suite_names.indexOf(name) === -1) {
      var suite = {'name': name, 'tests': tests};

      this.suite_names.push(name);
      this.suites.push(suite);
    }
    return this;
  };

  TestRunner.prototype.run = function() {
    var runner = this;

    forEach(this.suites, function(suite, i, suites) {
      // kinda inefficient, but no better way to do it.
      var options = {
        onTestDone: function(status, result) {
          if (status === 'success') {
            console.log(status.toUpperCase() + ': ' + suite.name + ': ' + result.name);
          } else {
            console.log(status.toUpperCase() + ': ' + suite.name + ': ' + result.name);
            console.error('>> ' + result.failure);
          }
        },

        onTestStart: function(name) {
          console.log('STARTED: ' + suite.name + ': ' + name);
        },

        onSuiteDone: function(status, results) {
          runner.totals.suitesRun++;
          runner.totals.count += results.tests.length;
          runner.totals.successes += results.numSuccesses;
          runner.totals.failures += results.numFailures;

          console.log('----');
          console.log('Finished: ' + suite.name);
          console.log('\tFailures: ' + results.numFailures);
          console.log('\tSuccesses: ' + results.numSuccesses);
          console.log('\tTotal: ' + results.tests.length);
          console.log('----');

          if (runner.totals.suitesRun === runner.suites.length) {
            console.log('---- TOTALS ----');
            console.log('\tFailures: ' + runner.totals.failures);
            console.log('\tSuccesses: ' + runner.totals.successes);
            console.log('\tTotal: ' + runner.totals.count);
            console.log('');
            console.log('Time taken: ' + (Date.now() - runner.startTime) + 'ms')
            console.log('----');

          }
        },
        beforeStartSuite: function(suites) {
          runner.startTime = Date.now();
        }
      };

      testing.runSuite(suite.tests, options);
    });
  };