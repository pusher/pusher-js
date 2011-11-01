  /*-----------------------------------------------
    TestRunner
  -----------------------------------------------*/
  // internals:
  // var hasNativeForEach = (Array.prototype.forEach && typeof Array.prototype.forEach == 'function');

  // Utilities:
  function forEach(array, callbackfn, thisArg) {
    for (var k=0, len=array.length; k<len;) {
      callbackfn.call(thisArg, array[k], k, array);
      k++;
    }
  }

  // MSIE doesn't have array.indexOf
  var nativeIndexOf = Array.prototype.indexOf;
  function indexOf(array, item) {
    if (array == null) return -1;
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
    return -1;
  }



  function TestRunner() {
    var runner = this;
    // storage:
    this.suites = [];
    this.suite_names = [];

    TestRunner.instances.push(this);

    this.totals = {
      failures: 0,
      successes: 0,
      count: 0,
      suitesRun: 0
    };

    assert.log = function(msg) {
      runner.log(msg)
    };

    assert.error = function(msg) {
      runner.log(msg, 'error')
    };
  }

  TestRunner.instances = [];
  TestRunner.each_instance = function(cb) {
    for (var r, i=0, tri=TestRunner.instances.length; i<tri; i++) {
      cb(TestRunner.instances[i]);
    }
  }

  TestRunner.prototype.resetTotals = function() {
    this.totals = {
      failures: 0,
      successes: 0,
      count: 0,
      suitesRun: 0
    };
  };

  TestRunner.prototype.addSuite = function(name, tests) {
    if (indexOf(this.suite_names, name) === -1) {
      var suite = {'name': name, 'tests': tests};

      this.suite_names.push(name);
      this.suites.push(suite);
    }
    return this;
  };

  TestRunner.prototype.log = function(data, type) {
    var className = 'log_' + (type || 'msg');
    var msg = document.createElement('pre');
    var text = document.createTextNode(data);

    //msg.setAttribute('class', className);
    msg.appendChild(text);

    this.log_element.append(msg);

    $(document).scrollTo('max', {axis: 'y'})
  }

  TestRunner.prototype.run = function() {
    var runner = this;

    forEach(this.suites, function(suite, i, suites) {
      // kinda inefficient, but no better way to do it.
      var options = {
        onTestStart: function(name) {
          runner.log('STARTED: ' + suite.name + ': ' + name);
        },

        onTestStopped: function() {
          runner.resetTotals();
          runner.onTestStopped();
        },

        onTestDone: function(status, result) {
          if (status === 'success') {
            runner.log(status.toUpperCase() + ': ' + suite.name + ': ' + result.name);
          } else {
            runner.log(status.toUpperCase() + ': ' + suite.name + ': ' + result.name);
            runner.log('>> ' + result.failure, 'error');
          }
        },

        onSuiteDone: function(status, results) {
          runner.totals.suitesRun++;
          runner.totals.count += results.tests.length;
          runner.totals.successes += results.numSuccesses;
          runner.totals.failures += results.numFailures;

          runner.log('----');
          runner.log('Finished: ' + suite.name);
          runner.log('\tFailures: ' + results.numFailures);
          runner.log('\tSuccesses: ' + results.numSuccesses);
          runner.log('\tTotal: ' + results.tests.length);
          runner.log('----');

          if (runner.totals.suitesRun === runner.suites.length) {
            runner.log('---- TOTALS ----');
            runner.log('\tFailures: ' + runner.totals.failures);
            runner.log('\tSuccesses: ' + runner.totals.successes);
            runner.log('\tTotal: ' + runner.totals.count);
            runner.log('');
            runner.log('Time taken: ' + (+(new Date()) - runner.startTime) + 'ms');
            runner.log('----');
          }

          runner.onSuiteDone();

          if (runner.totals.suitesRun === runner.suites.length) {
            runner.resetTotals();
          }
        },
        beforeStartSuite: function(suites) {
          runner.startTime = +(new Date());
        }
      };

      testing.runSuite(suite.tests, options);
    });
  };

  $(function() {
    var resetStatusTimer;
    var run_btn = $('#run-all');
    var status_text = $('#status');

    $('#clear').bind('click', function(e) {
      e.preventDefault();
      $("#log").empty();
      if (status_text.text() == 'Done' || status_text.text() == 'Stopped') {
        status_text.text('');
      }
    })

    testing.isTesting = false;

    run_btn.bind('click', function(e) {
      e.preventDefault();

      if (testing.isTesting) {
        testing.isTesting = false;
        run_btn.removeClass('running').text('Run');
        status_text.text('Stopping');
      } else {
        testing.isTesting = true;
        run_btn.addClass('running').text('Stop');
        status_text.text('Running')

        TestRunner.each_instance(function(instance) {
          instance.log_element = $('#log');
          instance.onSuiteDone = function() {
            if (instance.totals.suitesRun === instance.suites.length) {
              run_btn.removeClass('running').text('Run');
              status_text.text('Done');
              testing.isTesting = false;
            }
          };

          instance.onTestStopped = function() {
            instance.log('----------------------------------------------------------------------------------------------');
            instance.log('STOPPED');
            instance.log('----------------------------------------------------------------------------------------------');
            status_text.text('Stopped');
            testing.isTesting = false;

            if (resetStatusTimer) clearTimeout(resetStatusTimer);

            resetStatusTimer = setTimeout(function() {
              if (status_text.text() == 'Stopped') status_text.text('');
            }, 2000)
          };

          instance.run();
        });
      }
    })
  });