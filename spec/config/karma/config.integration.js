var version = require('../../../package').version;
var objectAssign = require('object-assign-deep');
var webpackConfig = require('../../../webpack/config.shared');
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;

var config = {
  basePath: '../../../',
  frameworks: ["jasmine"],
  client: {
    useIframe: true,
    captureConsole: true,
    clearContext: true
  },
  files: [
    '**/spec/javascripts/integration/index.web.js'
  ],
  preprocessors: {
    '**/spec/javascripts/integration/index.web.js': ['webpack'],
    '**/spec/javascripts/node_modules/**/*.ts': ['webpack']
  },

  reporters: ['coverage', 'verbose'],

  coverageReporter: {
    type : 'html',
    dir : 'coverage/'
  },

  webpack: objectAssign(webpackConfig, {
    resolve: {
      modulesDirectories: [
        'node_modules',
        'web_modules',
        'src',
        'src/runtimes/web',
        'src/runtimes',
        'spec/javascripts/helpers'
      ],
      alias: {
        integration: 'web/integration'
      }
    },
    externals: {
      '../package': '{version: "'+ version +'"}',
      testenv: "'web'"
    }
  }),

  port: 9876,
  runnerPort: 9100,

  colors: true,

  autoWatch: true,

  browsers: ['Chrome'],
  captureTimeout: 120000,
  browserNoActivityTimeout: 60000,

  singleRun: false
};

module.exports = config;
