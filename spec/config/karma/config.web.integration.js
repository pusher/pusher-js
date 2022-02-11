const webpack = require('webpack');

module.exports = {
  frameworks: ["jasmine"],
  files: [
    '**/spec/javascripts/integration/index.web.js'
  ],
  preprocessors: {
    '**/spec/javascripts/integration/index.web.js': ['webpack']
  },

  webpack: {
    resolve: {
      modules: [
        'src/runtimes/web',
        'spec/javascripts/helpers/web'
      ],
      alias: {
        integration: 'web/integration'
      }
    },
    externals: {
      testenv: "'web'"
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.MINIMAL_INTEGRATION_TESTS': JSON.stringify(process.env.MINIMAL_INTEGRATION_TESTS),
      })
    ],
  },

}
