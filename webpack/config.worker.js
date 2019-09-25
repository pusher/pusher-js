var path = require('path');
var NormalModuleReplacementPlugin = require('webpack')
  .NormalModuleReplacementPlugin;
var version = require('../package').version;
var objectAssign = require('object-assign-deep');
var webpack = require('webpack');
var configShared = require('./config.shared');

var filename = configShared.optimization.minimize
  ? 'pusher.worker.min.js'
  : 'pusher.worker.js';

var config = objectAssign(configShared, {
  output: {
    library: 'Pusher',
    path: path.join(__dirname, '../dist/worker'),
    filename: filename
  },
  resolve: {
    // in order to import the appropriate runtime.ts
    modules: ['src/runtimes/worker']
  },
  plugins: [
    new webpack.DefinePlugin({
      global: 'self',
      RUNTIME: JSON.stringify('worker')
    })
  ]
});

// the file should be pusher.worker.js not pusher.js
config.entry = {
  'pusher.worker': './src/core/index'
};

module.exports = config;
