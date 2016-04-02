module.exports = function(config) {
  config.set({
    basePath: '../../../',
    frameworks: ["jasmine"],

    files: []
      .concat(require(__dirname + "/../files/source"))
      .concat(require(__dirname + "/../files/unit_tests")),
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

    // for dev testing
    // browsers: ['Chrome', 'Firefox', 'Opera', 'Safari'],

    browserStack: {
      startTunnel: true
    },
    customLaunchers: {
      bs_ie8: {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '8.0',
        os: "Windows",
        os_version: '7'
      },
      bs_firefox_mac: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '21.0',
        os: 'OS X',
        os_version: 'Mountain Lion'
      },
      bs_iphone5: {
        base: 'BrowserStack',
        device: 'iPhone 5',
        os: 'ios',
        os_version: '6.0'
      }
    },

    browsers: ['bs_ie8', 'bs_firefox_mac', 'bs_iphone5'],
    captureTimeout: 60000,

    singleRun: true
  });
};
