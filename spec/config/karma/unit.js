var objectAssign = require('object-assign-deep');
var config = require('./config.unit');

if (process.env.CI) {
  var ci = require('./config.ci');
  config = objectAssign(config, ci);
  config.browsers = ci.browsers;

  if (process.env.CI == 'travis') {
    config.browsers = ['travis_chrome'];
  }
}

if (process.env.WORKER === 'true') {
  config = require('./config.worker')(config, 'unit');
}

module.exports = function(suite) {
  config.logLevel = suite.LOG_DEBUG;
  suite.set(config);
};
