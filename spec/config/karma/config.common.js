var webpackConfig = require('../../../webpack/config.shared');
var objectAssign = require('object-assign-deep');

var browserList;
if (process.env.MINIMAL_INTEGRATION_TESTS) {
  browserList = ['ChromeHeadless'];
} else {
  browserList = ['ChromeHeadless', 'FirefoxHeadless'];
}

module.exports = {
  basePath: '../../../',
  frameworks: ["jasmine"],

  reporters: ['verbose'],

  webpack: objectAssign({}, webpackConfig, {
    mode: 'development',
    resolve: {
      modules: [
        'src/runtimes/web',
        'spec/javascripts/helpers'
      ]
    },
    externals: {
      testenv: "'web'"
    }
  }),
  port: 9876,
  runnerPort: 9100,
  colors: true,
  autoWatch: true,

  browsers: browserList,
  captureTimeout: 5e3,
  browserNoActivityTimeout: 3e4,
  browserDisconnectTimeout: 3e4,
  browserDisconnectTolerance: 3,

  singleRun: true,
  client: {
    captureConsole: false,
  }
}

