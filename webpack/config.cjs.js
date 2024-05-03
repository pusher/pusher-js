var path = require('path');
const web = require('./config.web');
const { merge } = require('webpack-merge');

module.exports = merge({}, web, {
  output: {
    path: path.join(__dirname, '../dist/cjs'),
    libraryTarget: 'commonjs2'
  }
});
