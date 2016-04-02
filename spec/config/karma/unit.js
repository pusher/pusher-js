var version = require('../../../package').version;
var objectAssign = require('object-assign-deep');
var webpackConfig = require('../../../webpack/config.shared');
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;

module.exports = function(config) {
  config.set({
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

    reporters: ['progress', 'coverage', 'spec'],

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
    logLevel: config.LOG_INFO,

    autoWatch: true,

    // browsers: ['Chrome', 'Firefox', 'Opera', 'Safari'],
    browsers: ['Chrome'],
    captureTimeout: 120000,

    singleRun: true
  });
};
