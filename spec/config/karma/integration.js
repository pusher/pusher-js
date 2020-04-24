var objectAssign = require('object-assign-deep');
var config = require('./config.integration');

if (process.env.CI) {
  var ci = require('./config.ci');
  config = objectAssign(config, ci);
  config.browsers = ci.browsers;
}

if (process.env.WORKER === 'true') {
  config = require('./config.worker')(config, 'integration');
  config.webpack.resolve.alias = {
    pusher_integration: 'core/pusher',
    integration: 'node/integration'
  }
  if (process.env.CI) config.browsers = ['bs_chrome_74'];
}

module.exports = function(suite) {
  config.logLevel = suite.LOG_INFO,
  suite.set(config);
};
