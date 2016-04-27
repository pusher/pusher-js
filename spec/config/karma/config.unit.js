var version = require('../../../package').version;
var objectAssign = require('object-assign-deep');
var webpackConfig = require('../../../webpack/config.shared');
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;

module.exports = {
  basePath: '../../../',
  frameworks: ["jasmine"],

  files: [
    '**/spec/javascripts/unit/index.web.js'
  ],
  preprocessors: {
    '**/spec/javascripts/node_modules/**/*.ts': ['webpack'],
    '**/spec/javascripts/unit/index.web.js': ['webpack'],
    '**/spec/javascripts/helpers/**/*.js': ['webpack']
  },

  reporters: ['coverage', 'verbose'],

  coverageReporter: {
    type : 'html',
    dir : 'coverage/'
  },

  webpack: objectAssign(webpackConfig,{
    resolve: {
      modulesDirectories: [
        'node_modules',
        'web_modules',
        'src',
        'src/runtimes/web',
        'src/runtimes',
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

  // browsers: ['Chrome', 'Firefox', 'Opera', 'Safari'],
  browsers: ['Chrome'],
  captureTimeout: 120000,
  browserNoActivityTimeout: 60000,

  singleRun: true
}
