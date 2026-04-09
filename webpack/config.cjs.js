var path = require('path');
var webpack = require('webpack');
const { merge } = require('webpack-merge');
var configShared = require('./config.shared');

var entry = './src/core/pusher.js';
var filename = 'pusher.js';
if (process.env.INCLUDE_TWEETNACL === 'true') {
  entry = './src/core/pusher-with-encryption.js';
  filename = 'pusher-with-encryption.js';
}

module.exports = merge({}, configShared, {
  entry: {
    pusher: entry,
  },
  output: {
    library: { type: 'commonjs2' },
    path: path.join(__dirname, '../dist/cjs'),
    filename: filename,
  },
  resolve: {
    modules: ['src/runtimes/web'],
  },
  plugins: [
    new webpack.DefinePlugin({
      RUNTIME: JSON.stringify('web'),
    }),
  ],
});
