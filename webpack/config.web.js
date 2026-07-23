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
    library: { name: 'Pusher', type: 'umd' },
    // Webpack 5 defaults the UMD wrapper's root object to `self`, which
    // doesn't exist in Node.js/SSR environments. Matches config.worker.js,
    // which already sets this for the same reason.
    globalObject: 'this',
    path: path.join(__dirname, '../dist/web'),
    filename: filename,
  },
  resolve: {
    modules: ['src/runtimes/web'],
  },
  plugins: [
    new webpack.DefinePlugin({
      // Default callback `this` context. In a browser this resolves to
      // `window` (unchanged behavior); falls back to `self` (web workers) and
      // then `this` so the bundle doesn't throw when imported in Node/SSR,
      // where `window` is undefined. Avoids `globalThis` to keep IE support.
      global:
        '(typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : this)',
      RUNTIME: JSON.stringify('web'),
    }),
  ],
});
