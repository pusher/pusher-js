var path = require("path");
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;
var version = require('../package').version;
var objectAssign = require('object-assign-deep');
var webpack = require('webpack');

var config = objectAssign(require('./config.shared'),{
  entry: {
    "pusher.worker": "./src/core/index",
  }
  output: {
    library: "Pusher",
    path: path.join(__dirname, "../dist/worker"),
    filename: "pusher.worker.js"
  },
  resolve: {
    modules: ['src/runtimes/worker']
  },
  plugins: [
    new webpack.DefinePlugin({
      global: "self"
    })
  ]
});

module.exports = config;
