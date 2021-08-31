const { merge } = require('webpack-merge');
const commonConfig = require('./config.common');


module.exports = merge(commonConfig, {
  files: ['**/spec/javascripts/unit/index.web.js'],
  preprocessors: {
    '**/spec/javascripts/unit/index.web.js': ['webpack']
  },
});
