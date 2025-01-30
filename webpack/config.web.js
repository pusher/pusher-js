var path = require('path');
var webpack = require('webpack');
var NormalModuleReplacementPlugin = webpack.NormalModuleReplacementPlugin;
const { merge } = require('webpack-merge');
var configShared = require('./config.shared');

var filename = configShared.optimization.minimize
  ? 'pusher.min.js'
  : 'pusher.js';

var entry = './src/core/pusher.js';
if (process.env.INCLUDE_TWEETNACL === 'true') {
  entry = './src/core/pusher-with-encryption.js';
  filename = filename.replace('pusher', 'pusher-with-encryption');
}

module.exports = merge({}, configShared, {
  entry: {
    pusher: entry,
  },
  output: {
    library: 'Pusher',
    path: path.join(__dirname, '../dist/web'),
    filename: filename,
    libraryTarget: 'umd',
  },
  resolve: {
    modules: ['src/runtimes/web'],
  },
  plugins: [
    new webpack.DefinePlugin({
      global: 'window',
      RUNTIME: JSON.stringify('web'),
    }),
  ],
});
