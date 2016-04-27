var objectAssign = require('object-assign-deep');
var config = require('./config.unit');

if (process.env.CI === 'true') {
  var ci = require('./config.ci');
  config = objectAssign(config, ci);
  config.browsers = ci.browsers;
}

module.exports = function(suite) {
  config.logLevel = suite.LOG_INFO,
  suite.set(config);
};
