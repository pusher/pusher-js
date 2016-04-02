var path = require("path");
var webpack = require('webpack');
var NormalModuleReplacementPlugin = webpack.NormalModuleReplacementPlugin;
var version = require('../package').version;
var objectAssign = require('object-assign-deep');

///////////////////////////////////////////////////
// The web build uses:                           //
// XHR, WebSocket and NetInfo in platforms/web/* //
///////////////////////////////////////////////////
var config = objectAssign(require('./config.shared'),{
  entry: "./src/core/pusher",
  output: {
    library: "Pusher",
    path: path.join(__dirname, "../dist/web"),
    filename: "pusher.js"
  },
  externals: {
    '../package': '{version: "'+ version +'"}'
  },
  resolve: {
    modulesDirectories: ['node_modules', 'web_modules', 'src/', 'src/runtimes/web', 'src/runtimes']
  }
});

module.exports = config;
