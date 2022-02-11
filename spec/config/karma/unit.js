const { merge } = require('webpack-merge');
const commonConfig = require('./config.common');
var webConfig = require('./config.web');
var config = merge(commonConfig, webConfig);

if (process.env.WORKER === 'true') {
  var workerConfig = require('./config.worker');
  config = merge(commonConfig, workerConfig);
}

if (process.env.CI) {
  var ci = require('./config.ci');
  config = merge(config, ci);
  config.browsers = ci.browsers;
  if (process.env.WORKER === 'true') {
    // only run worker test on Chrome for CI
    config.browsers = ['bs_chrome_74'];
  }
}

module.exports = function(suite) {
  config.logLevel = suite.LOG_WARN;
  suite.set(config);
};
