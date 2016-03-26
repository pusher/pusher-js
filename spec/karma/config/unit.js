var version = require('../../../package').version;
var objectAssign = require('object-assign-deep');
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;

var webpackConfig = require('../../../webpack/config.shared')

module.exports = function(config) {
  config.set({
    basePath: '../../../',
    frameworks: ["jasmine"],

    files: require(__dirname + "/../files/unit_tests"),
    preprocessors: {
      '**/spec/javascripts/unit/**/*.js': ['webpack'],
      '**/spec/node_modules/**/*.ts': ['webpack']
    },

    reporters: ['progress', 'coverage'],

    coverageReporter: {
      type : 'html',
      dir : 'coverage/'
    },

    webpack: objectAssign(webpackConfig,{
      resolve: {
        root: [
          __dirname + '/../../../src',
          __dirname + '/../../../src/node_modules',
          __dirname + '/../../node_modules'
        ]
      },
      externals: {
        '../package': '{version: "'+ version +'"}'
      },
      plugins: [
        new NormalModuleReplacementPlugin(
          /^pusher-websocket-iso-externals-node\/ws$/,
          "pusher-websocket-iso-externals-web/ws"
        ),
        new NormalModuleReplacementPlugin(
          /^pusher-websocket-iso-externals-node\/xhr$/,
          "pusher-websocket-iso-externals-test/xhr"
        ),
        new NormalModuleReplacementPlugin(
          /^pusher-websocket-iso-externals-node\/net_info$/,
          "pusher-websocket-iso-externals-web/net_info"
        )
      ]
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
