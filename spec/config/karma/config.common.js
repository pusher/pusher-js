const { merge } = require('webpack-merge');
const webpackConfig = require('../../../webpack/config.shared');

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

  webpack: merge({}, webpackConfig, {
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
  captureTimeout: 10e3,
  browserNoActivityTimeout: 3e4,
  browserDisconnectTimeout: 3e4,
  browserDisconnectTolerance: 3,

  singleRun: true,
  client: {
    captureConsole: false,
    jasmine: {
      // This new behaviour in jasmine is enabled by default but, some of our
      // old tests rely on sequential execution.
      // @todo Enable random order execution (i.e. remove this flag) and fix tests that are broken
      random: false
    }
  }
};
