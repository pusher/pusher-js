module.exports = function(config) {
  config.set({
    basePath: '../../../',
    frameworks: ["jasmine"],

    files: []
      .concat(require(__dirname + "/../files/built"))
      .concat(require(__dirname + "/../files/integration_tests")),
    exclude: [
      'src/sockjs/**/*',
    ],

    preprocessors: {
      '**/src/**/*.js': 'coverage'
    },
    reporters: ['progress', 'coverage'],

    coverageReporter: {
      type : 'html',
      dir : 'coverage/'
    },

    port: 9876,
    runnerPort: 9100,

    colors: true,
    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ['Chrome', 'Firefox', 'Opera', 'Safari'],
    captureTimeout: 120000,

    singleRun: true
  });
};
