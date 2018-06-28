module.exports = {
  basePath: '../../../',
  frameworks: ["jasmine"],

  // reporters: ['coverage', 'verbose'],
  reporters: ['spec'],
  specReporter: {
    suppressSkipped: true
  },

  // coverageReporter: {
  //   type : 'html',
  //   dir : 'coverage/'
  // },

  plugins: [
    'karma-webpack',
    'karma-sourcemap-loader',
    'karma-spec-reporter',
    'karma-chrome-launcher',
    'karma-jasmine',
  ],
  preprocessors: {
    '**/spec/javascripts/node_modules/**/*.ts': ['webpack', 'sourcemap'],
    '**/*_spec.js': ['sourcemap']
  },

  webpack: {
    devtool: 'inline-source-map',
    resolve: {
      modules: [
        'node_modules',
        'src',
        'src/runtimes/web',
        'src/runtimes',
        'spec/javascripts/helpers'
      ]
    },
    externals: {
      testenv: "'web'"
    },
  },
  port: 9876,
  runnerPort: 9100,
  colors: true,
  autoWatch: true,

  // browsers: ['Chrome', 'Firefox', 'Opera', 'Safari'],
  browsers: ['Chrome'],
  captureTimeout: 3e5,
  browserNoActivityTimeout: 3e5,
  browserDisconnectTimeout: 3e5,
  browserDisconnectTolerance: 3,

  singleRun: true
}
