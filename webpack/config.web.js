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
    // `global` isn't redefined here, so webpack resolves it once to the real
    // global object: window in browsers, and the global object in Node/SSR,
    // where window is undefined. config.cjs.js works the same way.
    new webpack.DefinePlugin({
      RUNTIME: JSON.stringify('web'),
    }),
  ],
});
