const { merge } = require('webpack-merge');
const webpack = require('webpack');
const commonConfig = require('./config.common');

module.exports = merge({}, commonConfig, {
  files: [
    '**/spec/javascripts/integration/index.web.js'
  ],
  preprocessors: {
    '**/spec/javascripts/integration/index.web.js': ['webpack']
  },

  webpack: {
    resolve: {
      modules: ['spec/javascripts/helpers/web'],
      alias: {
        integration: 'web/integration'
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.MINIMAL_INTEGRATION_TESTS': JSON.stringify(process.env.MINIMAL_INTEGRATION_TESTS),
      })
    ],
  }
});
