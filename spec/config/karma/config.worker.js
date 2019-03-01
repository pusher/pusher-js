var objectAssign = require('object-assign-deep');

/*
Takes + modifies existing Karma config + the name of the suite,
i.e. 'unit' or 'integration'.
Sorts out the module resolution for this build and changes
the testenv.
*/
module.exports = function(config, suite) {
  config.plugins = [
    'karma-*',
    '@keith_duncan/karma-jasmine-web-worker',
  ];
  config.frameworks = ["jasmine-web-worker"];
  config.files = [
    '**/spec/javascripts/'+suite+'/index.worker.js'
  ];

  config.preprocessors = {
    '**/spec/javascripts/node_modules/**/*.ts': ['webpack'],
    '**/spec/javascripts/helpers/**/*.js': ['webpack']
  };

  var index = '**/spec/javascripts/'+suite+'/index.worker.js';
  config.preprocessors[index] = ['webpack'];

  config.webpack.resolve.modulesDirectories = [
    'node_modules',
    'web_modules',
    'src',
    'src/runtimes/worker',
    'src/runtimes',
    'spec/javascripts/helpers'
  ]
  config.webpack.externals.testenv = "'worker'";

  switch (suite) {
    case 'integration':
      config.webpack.resolve.alias = objectAssign(config.webpack.resolve.alias || {}, {
        pusher_integration: 'core',
        integration: 'node/integration',
      });
      break;
    case 'unit':
      config.webpack.resolve.alias = objectAssign(config.webpack.resolve.alias || {}, {
        dependencies: 'empty'
      });
      break;
  }

  // only run worker test on Chrome for CI
  switch (process.env.CI) {
    case 'travis':
      config.browsers = ['travis_chrome'];
      break;
    case 'local':
      config.browsers = ['local_chrome'];
      break;
    default:
      config.browsers = ['bs_chrome_49'];
      break;
  }

  return config;
}
