var path = require('path');
var webpack = require('webpack');
var NormalModuleReplacementPlugin = webpack.NormalModuleReplacementPlugin;
var objectAssign = require('object-assign-deep');
var configShared = require('./config.shared');

var filename = configShared.optimization.minimize
  ? 'pusher.min.js'
  : 'pusher.js';

module.exports = objectAssign({}, configShared, {
  output: {
    library: 'Pusher',
    path: path.join(__dirname, '../dist/web'),
    filename: filename,
    libraryTarget: 'umd'
  },
  resolve: {
    modules: ['src/runtimes/web']
  },
  plugins: [
    new webpack.DefinePlugin({
      global: 'window',
      RUNTIME: JSON.stringify('web')
    })
  ]
});
