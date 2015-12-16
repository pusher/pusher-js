var version = require('../../../package').version;

var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;

module.exports = function(config) {
  config.set({
    basePath: '../../../',
    frameworks: ["jasmine"],

    files: []
      .concat(require(__dirname + "/../files/integration_tests")),

    preprocessors: {
      '**/src/**/*.js': ['coverage', 'webpack'],
      '**/spec/javascripts/integration/**/*.js': ['webpack']
    },
    reporters: ['progress', 'coverage'],

    coverageReporter: {
      type : 'html',
      dir : 'coverage/'
    },

    webpack: {
      resolve: {
        root: [__dirname + '/../../../src', __dirname + '/../../../src/platforms/web']
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
    },

    port: 9876,
    runnerPort: 9100,

    colors: true,
    logLevel: config.LOG_INFO,

    autoWatch: true,

    // browsers: ['Chrome', 'Firefox', 'Opera', 'Safari'],

    customLaunchers: {
      ChromeWithoutSecurity: {
        base: 'Chrome',
        flags: ['--disable-web-security']
      }
    },

    browsers: ['ChromeWithoutSecurity'],
    captureTimeout: 120000,

    singleRun: true
  });
};
