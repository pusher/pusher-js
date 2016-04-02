var version = require('../../../package').version;
var objectAssign = require('object-assign-deep');
var webpackConfig = require('../../../webpack/config.shared');
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;

module.exports = function(config) {
  config.set({
    basePath: '../../../',
    frameworks: ["jasmine"],
    client: {
      useIframe: true,
      captureConsole: true,
      clearContext: true
    },

    // files: require(__dirname + "/../files/integration_tests"),
    files: [
      '**/spec/javascripts/integration/index.js'
    ],
    preprocessors: {
      '**/spec/javascripts/integration/index.js': ['webpack'],
      '**/spec/javascripts/node_modules/**/*.ts': ['webpack']
    },

    reporters: ['progress', 'coverage', 'spec'],

    coverageReporter: {
      type : 'html',
      dir : 'coverage/'
    },

    webpack: objectAssign(webpackConfig, {
      resolve: {
        // root: [
        //   __dirname + '/../../../src',
        //   __dirname + '/../../../src/node_modules'
        // ]
        modulesDirectories: ['node_modules', 'web_modules', 'src', 'src/runtimes/web', 'src/runtimes']
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
          "pusher-websocket-iso-externals-web/xhr"
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

    browsers: ['Chrome'],
    captureTimeout: 120000,

    singleRun: true
  });
};
