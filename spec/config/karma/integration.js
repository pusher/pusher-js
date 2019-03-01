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
  config.webpack.resolve.alias = {
    pusher_integration: 'core',
    integration: 'node/integration'
  }

  // only run worker test on Chrome for CI
  switch (process.env.CI) {
    case 'travis':
      config.browsers = ['travis_chrome'];
      break;
    default:
      config.browsers = ['bs_chrome_49'];
      break;
  }
}

module.exports = function(suite) {
  config.logLevel = suite.LOG_INFO,
  suite.set(config);
};
