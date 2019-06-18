var path = require("path");
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;
var version = require('../package').version;
var objectAssign = require('object-assign-deep');
var webpack = require('webpack');

var filename = process.env.MODE === "development" ?
  "pusher.worker.js":
  "pusher.worker.min.js";

var config = objectAssign(require('./config.shared'),{
  output: {
    library: "Pusher",
    path: path.join(__dirname, "../dist/worker"),
    filename: filename
  },
  resolve: {
    // in order to import the appropriate runtime.ts
    modules: ['src/runtimes/worker']
  },
  plugins: [
    new webpack.DefinePlugin({
      global: "self"
    })
  ]
});

// the file should be pusher.worker.js not pusher.js
config.entry = {
  "pusher.worker": "./src/core/index",
};

module.exports = config;
