// Testacular configuration
// Generated on Fri Mar 15 2013 15:43:53 GMT+0000 (GMT)


// base path, that will be used to resolve files and exclude
basePath = '../../';


// list of files / patterns to load in the browser
files = [
  JASMINE,
  JASMINE_ADAPTER,

  'src/pusher.js',
  'src/util.js',
  'src/defaults.js',
  'src/errors.js',
  'src/dependency_loader.js',
  'src/dependencies.js',
  'src/events_dispatcher.js',
  'src/net_info.js',

  'src/utils/timer.js',

  'src/pusher_channels.js',

  'src/base64.js',
  'src/jsonp/jsonp_request.js',
  'src/jsonp/jsonp_receiver.js',

  'src/timeline/timeline.js',
  'src/timeline/timeline_sender.js',

  'src/strategies/best_connected_ever_strategy.js',
  'src/strategies/cached_strategy.js',
  'src/strategies/delayed_strategy.js',
  'src/strategies/first_connected_strategy.js',
  'src/strategies/if_strategy.js',
  'src/strategies/sequential_strategy.js',
  'src/strategies/transport_strategy.js',

  'src/transports/abstract_transport.js',
  'src/transports/flash_transport.js',
  'src/transports/sockjs_transport.js',
  'src/transports/ws_transport.js',

  'src/transports/assistant_to_the_transport_manager.js',
  'src/transports/transport_manager.js',

  'src/strategies/strategy_builder.js',

  'src/connection/protocol.js',
  'src/connection/connection.js',
  'src/connection/handshake.js',
  'src/connection/connection_manager.js',

  'spec/javascripts/helpers/mocks.js',
  'spec/javascripts/unit/**/*_spec.js',
  'spec/javascripts/integration/**/*_spec.js'
];


// list of files to exclude
exclude = [
  'src/sockjs/**/*',
  'src/web-socket-js/**/*'
];


preprocessors = {
  '**/src/**/*.js': 'coverage'
};


// test results reporter to use
// possible values: 'dots', 'progress', 'junit'
reporters = ['progress', 'coverage'];


coverageReporter = {
  type : 'html',
  dir : 'coverage/'
}


// web server port
port = 9876;


// cli runner port
runnerPort = 9100;


// enable / disable colors in the output (reporters and logs)
colors = true;


// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;


// enable / disable watching file and executing tests whenever any file changes
autoWatch = true;


// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
browsers = ['Chrome', 'Firefox', 'Opera', 'Safari'];


// If browser does not capture in given timeout [ms], kill it
captureTimeout = 60000;


// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = false;
