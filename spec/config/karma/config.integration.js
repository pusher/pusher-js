var objectAssign = require('object-assign-deep');
var webpack = require('webpack');
var commonConfig = require('./config.common');

module.exports = objectAssign({}, commonConfig, {
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
