var BrowserLog;

$(document).ready(function() {
  var log = $('#log');
  var status = $('#status');

  var writeline = function(data) {
    var msg = document.createElement('pre');
    var text = document.createTextNode(data);

    msg.appendChild(text);

    log.append(msg);

    $(document).scrollTo('max', {axis: 'y'})
  }

  BrowserLog = {
    log: writeline,
    debug: writeline,
    info: writeline,
    warn: writeline,
    error: writeline,
  }

  var run = function() {
    writeline('starting tests')
    status.html('running')
    var runner = new TestSuiteRunner(BrowserLog);
    runner.run(Tests, function(err, duration) {
      status.html('')
      writeline('finished tests in ' + duration + "s");
    });
  }

  $('#clear').click(function() {
    log.empty();
  })
  
  $('#run-all').click(function() {
    run();
  })
})
