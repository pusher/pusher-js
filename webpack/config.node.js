var path = require('path');
var objectAssign = require('object-assign-deep');
var configShared = require('./config.shared');
var webpack = require('webpack');

module.exports = objectAssign({}, configShared, {
  entry: {
    pusher: './src/core/pusher-with-encryption.js'
  },
  output: {
    library: 'Pusher',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist/node'),
    filename: 'pusher.js'
  },
  target: 'node',
  resolve: {
    // in order to import the appropriate runtime.ts
    modules: ['src/runtimes/node']
  },
  plugins: [
    new webpack.DefinePlugin({
      RUNTIME: JSON.stringify('node')
    })
  ]
});
