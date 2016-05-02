var path = require("path");
var webpack = require('webpack');
var NormalModuleReplacementPlugin = webpack.NormalModuleReplacementPlugin;
var objectAssign = require('object-assign-deep');

///////////////////////////////////////////////////
// The web build uses:                           //
// XHR, WebSocket and NetInfo in platforms/web/* //
///////////////////////////////////////////////////
var config = objectAssign(require('./config.shared'),{
  output: {
    library: "Pusher",
    path: path.join(__dirname, "../dist/web"),
    filename: "[name].js"
  },
  resolve: {
    modulesDirectories: ['node_modules', 'web_modules', 'src/', 'src/runtimes/web', 'src/runtimes']
  }
});

module.exports = config;
