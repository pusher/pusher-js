var objectAssign = require('object-assign-deep');
var config = require('./config.unit');

if (process.env.WORKER === 'true') {
  config = require('./config.worker')(config, 'unit');

  // only run worker test on Chrome for CI
  if (process.env.CI) config.browsers = ['bs_chrome_74'];
}

module.exports = function(suite) {
  config.logLevel = suite.LOG_DISABLE;
  suite.set(config);
};
