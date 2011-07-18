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
    // templates:
    var self = this;

    // storage:
    self.suites = [];
    self.suite_names = [];


    var totals = {
      failures: 0,
      successes: 0,
      count: 0,
      suitesRun: 0
    };

    // callbacks

    function onSuiteFinished(suite, status, results) {
      totals.suitesRun++;
      totals.count += results.tests.length;
      totals.successes += results.numSuccesses;
      totals.failures += results.numFailures;
      
      console.log('----');
      console.log('Finished: ' + suite.name);
      console.log('\tFailures: ' + results.numFailures);
      console.log('\tSuccesses: ' + results.numSuccesses);
      console.log('\tTotal: ' + results.tests.length);
      console.log('----');
      
      console.log(totals.suitesRun, self.suites.length)
      
      if (totals.suitesRun === self.suites.length) {
        onAllSuitesDone(totals);
      }
    }
    
    function onAllSuitesDone(totals) {
      console.log('---- TOTALS ----');
      console.log('\tFailures: ' + totals.failures);
      console.log('\tSuccesses: ' + totals.successes);
      console.log('\tTotal: ' + totals.count);
      console.log('----');
    }

    function onAddSuite(suite) {
    }

    return {
      addSuite: function(name, tests) {
        if (self.suite_names.indexOf(name) === -1) {
          var suite = {'name': name, 'id': guid(), 'tests': tests};

          self.suite_names.push(name);
          self.suites.push(suite);
        }
        return this;
      },

      run: function() {
        forEach(self.suites, function(suite, i, suites) {
          // kinda inefficient, but no better way to do it.
          var options = {
            onTestDone: function(status, result) {
              if (status === 'success') {
                console.log(status.toUpperCase() + ': ' + result.name);
              } else {
                console.error(status.toUpperCase() + ': ' + result.name);
                console.error('>> ' + result.failure);
              }
            },

            onTestStart: function(name) {
              console.log('STARTED: ' + name);
            },

            onSuiteDone: function(status, results) {
              onSuiteFinished(suite, status, results);
            },
            beforeStartSuite: function(suites) {
            }
          };

          testing.runSuite(suite.tests, options);
        });
      }
    }
  }

  function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  }

  function guid() {
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  }


  /*-----------------------------------------------
    Cognac
  -----------------------------------------------*/