var version = require('../../../package').version;
var objectAssign = require('object-assign-deep');
var webpackConfig = require('../../../webpack/config.shared');
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;
var commonConfig = require('./config.common');

module.exports = objectAssign(commonConfig,{
  files: [
    '**/spec/javascripts/unit/index.web.js'
  ],
  preprocessors: {
    '**/spec/javascripts/unit/index.web.js': ['webpack']
  },

  webpack: webpackConfig
});
