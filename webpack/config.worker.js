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

var entry = './src/core/pusher.js';
if (process.env.INCLUDE_TWEETNACL === 'true') {
  entry = './src/core/pusher-with-encryption.js';
  filename = filename.replace('pusher', 'pusher-with-encryption');
}

var config = objectAssign(configShared, {
  entry: {
    pusher: entry
  },
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

module.exports = config;
