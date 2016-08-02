var version = require('../../../package').version;
var objectAssign = require('object-assign-deep');
var webpackConfig = require('../../../webpack/config.shared');
delete webpackConfig["entry"]; // so that we can require core/index without worry.

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
    }
  })
});
