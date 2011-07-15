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
    //var suiteTemplate = document.getElementById('suiteTemplate').innerText;
    //var testTemplate = document.getElementById('testTemplate').innerText;

    // storage:
    var suites = [];
    var suite_names = [];


    // callbacks

    function onSuiteFinished(suite, status, results) {
      console.log('----');
      console.log('Finished: ' + suite.name);
      console.log('\tFailures: ' + results.numFailures);
      console.log('\tSuccesses: ' + results.numSuccesses);
      console.log('\tTotal: ' + results.tests.length);
      console.log('----');
    }

    function onAddSuite(suite) {
      // $('#suites-list').append(Mustache.to_html(suiteTemplate, {
      //         'name': suite.name,
      //         'id': suite.id
      //       }));
      //
      //       for(var name in suite.tests) {
      //         var test = suite.tests[name];
      //
      //         $('#'+suite.id).find('ul.tests-list').append(Mustache.to_html(testTemplate, {
      //           name: name,
      //           source: test.toString(),
      //           id: test.id
      //         }));
      //       }
    }

    return {
      addSuite: function(name, tests) {
        if (suite_names.indexOf(name) === -1) {
          var suite = {'name': name, 'id': guid(), 'tests': tests};

          suite_names.push(name);
          suites.push(suite);
        }
        return this;
      },

      run: function() {
        forEach(suites, function(suite, i, suites) {
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