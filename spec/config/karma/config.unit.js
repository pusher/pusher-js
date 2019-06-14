var objectAssign = require('object-assign-deep');
var webpackConfig = require('../../../webpack/config.shared');
var commonConfig = require('./config.common');

module.exports = objectAssign(commonConfig,{
  files: [
    '**/spec/javascripts/unit/index.web.js'
  ],
  preprocessors: {
    '**/spec/javascripts/unit/index.web.js': ['webpack']
  },
});
