var objectAssign = require('object-assign-deep');
var config = require('./config.integration');

if (process.env.CI) {
  var ci = require('./config.ci');
  config = objectAssign(config, ci);
  config.browsers = ci.browsers;

  if (process.env.CI == 'travis') {
    config.browsers = ['travis_chrome'];
  }
}

if (process.env.WORKER === 'true') {
  config = require('./config.worker')(config, 'integration');
} else {
  config.webpack.resolve.alias = objectAssign(config.webpack.resolve.alias || {}, {
    dependencies: 'dom/dependencies',
    dependency_loader: 'dom/dependency_loader',
  });
}

module.exports = function(suite) {
  config.logLevel = suite.LOG_INFO,
  suite.set(config);
};
