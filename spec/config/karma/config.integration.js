var version = require('../../../package').version;
var objectAssign = require('object-assign-deep');
var webpackConfig = require('../../../webpack/config.shared');
var webpack = require('webpack');
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;
var commonConfig = require('./config.common');

module.exports = objectAssign(commonConfig, {
  files: [
    '**/spec/javascripts/integration/index.web.js'
  ],
  preprocessors: {
    '**/spec/javascripts/integration/index.web.js': ['webpack']
  },

  webpack: objectAssign(webpackConfig, {
    resolve: {
      alias: {
        integration: 'web/integration'
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.MINIMAL_INTEGRATION_TESTS': JSON.stringify(process.env.MINIMAL_INTEGRATION_TESTS),
        'process.env.PUSHER_APP_CLUSTER': JSON.stringify(process.env.PUSHER_APP_CLUSTER),
        'process.env.PUSHER_APP_KEY': JSON.stringify(process.env.PUSHER_APP_KEY),
        'process.env.PUSHER_AUTH_ENDPOINT': JSON.stringify(process.env.PUSHER_AUTH_ENDPOINT),
      })
    ],
  })
});
