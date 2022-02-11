const webpack = require('webpack');

module.exports = {
  frameworks: ['jasmine-web-worker'],
  files: ['**/spec/javascripts/integration/index.worker.js'],
  preprocessors: {
    '**/spec/javascripts/integration/index.worker.js': ['webpack']
  },
  webpack: { 
    resolve: {
      modules: [
        'src/runtimes/worker',
        'spec/javascripts/helpers/worker'
      ],
      alias:{
        'dom/dependencies': 'worker/mock-dom-dependencies',
        pusher_integration: 'core/pusher',
        integration: 'node/integration'
      }
    },
    externals: {
      testenv: "'worker'"
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.MINIMAL_INTEGRATION_TESTS': JSON.stringify(process.env.MINIMAL_INTEGRATION_TESTS),
      })
    ],
  }
}
