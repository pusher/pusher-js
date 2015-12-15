var path = require("path");
var StringReplacePlugin = require('string-replace-webpack-plugin');
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;
var pathToSource = require('./path_to_source');
var version = require('../package').version;

//////////////////////////////////////////////
// The ReactNative build uses:              //
// WebSocket: platforms/web/ws              //
// XHR: platforms/web/xhr                   //
// NetInfo: platforms/react-native/net_info //
//////////////////////////////////////////////
module.exports = {
  entry: "./src/pusher",
  output: {
    library: "Pusher",
    libraryTarget:"commonjs2",
    path: path.join(__dirname, "../bundle/react-native"),
    filename: "pusher.js"
  },
  target: "node",
  externals: {
    "react-native": "{}",
    '../package': 'var {version: "'+ version +'"}'
  },
  plugins: [
    new NormalModuleReplacementPlugin(/platforms\/node\/ws/, pathToSource('platforms/web/ws')),
    new NormalModuleReplacementPlugin(/platforms\/node\/xhr/, pathToSource('platforms/web/xhr')),
    new NormalModuleReplacementPlugin(/platforms\/node\/net_info/, pathToSource('platforms/react-native/net_info'))
  ]
}