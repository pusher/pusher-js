var webpackConfig = require('../../../webpack/config.shared');
var objectAssign = require('object-assign-deep');

var browserList;
if (process.env.MINIMAL_INTEGRATION_TESTS) {
  browserList = ['Chrome'];
} else {
  browserList = ['Chrome', 'Firefox', 'Opera', 'Safari'];
}

module.exports = {
  basePath: '../../../',
  frameworks: ["jasmine"],

  reporters: ['coverage', 'verbose'],

  coverageReporter: {
    type : 'html',
    dir : 'coverage/'
  },

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
  captureTimeout: 3e5,
  browserNoActivityTimeout: 3e5,
  browserDisconnectTimeout: 3e5,
  browserDisconnectTolerance: 3,

  singleRun: true,
  client: {
    captureConsole: false,
  }
}
