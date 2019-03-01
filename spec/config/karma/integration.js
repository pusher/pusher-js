var objectAssign = require('object-assign-deep');
var config = require('./config.integration');

if (process.env.CI) {
  var ci = require('./config.ci');
  config = objectAssign(config, ci);
  config.browsers = ci.browsers;

  switch (process.env.CI) {
    case 'travis':
      config.browsers = ['travis_chrome'];
      break;
    case 'local':
      config.browsers = ['local_chrome'];
      break;
  }
}

if (process.env.WORKER === 'true') {
  config = require('./config.worker')(config, 'integration');
} else {
  config.webpack = objectAssign(config.webpack, {
    resolve: {
      alias: {
        dependencies: 'dom/dependencies',
        dependency_loader: 'dom/dependency_loader',
      }
    }
  });
}

module.exports = function(suite) {
  config.logLevel = suite.LOG_INFO,
  suite.set(config);
};
