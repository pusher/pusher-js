module.exports = {
  basePath: '../../../',
  frameworks: ["jasmine"],

  reporters: ['coverage', 'verbose'],

  coverageReporter: {
    type : 'html',
    dir : 'coverage/'
  },

  preprocessors: {
    '**/spec/javascripts/node_modules/**/*.ts': ['webpack']
  },

  webpack: {
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
  },
  port: 9876,
  runnerPort: 9100,
  colors: true,
  autoWatch: true,

  browsers: ['Chrome', 'Firefox', 'Opera', 'Safari'],
  captureTimeout: 3e5,
  browserNoActivityTimeout: 3e5,
  browserDisconnectTimeout: 3e5,
  browserDisconnectTolerance: 3,

  singleRun: true
}
