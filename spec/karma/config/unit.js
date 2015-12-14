var path = require('path');
var webpack = require('webpack');

module.exports = function(config) {
  config.set({
    basePath: '../../../',
    frameworks: ["jasmine"],

    files: []
      .concat(require(__dirname + "/../files/unit_tests")),

    preprocessors: {
      '**/src/**/*.js': ['coverage', 'webpack'],
      '**/spec/javascripts/helpers/*.js': ['webpack'],
      '**/spec/javascripts/unit/**/*.js': ['webpack']
    },
    reporters: ['progress', 'coverage'],

    coverageReporter: {
      type : 'html',
      dir : 'coverage/'
    },

    webpack: {
      resolve: {
        root: [__dirname + '/../../../src',  __dirname + '/../../javascripts/helpers']
      }
    },

    plugins: [
      'karma-webpack', 
      'karma-coverage', 
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      // 'karma-opera-launcher',
      'karma-safari-launcher'
    ],    

    port: 9876,
    runnerPort: 9100,

    colors: true,
    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ['Chrome', 'Firefox', 
    // 'Opera', 
    'Safari'],
    captureTimeout: 60000,

    singleRun: true
  });
};
