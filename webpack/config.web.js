var path = require("path");
var StringReplacePlugin = require('string-replace-webpack-plugin');
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;
var pathToSource = require('./path_to_source');
var version = require('../package').version;

///////////////////////////////////////////////////
// The web build uses:                           //
// XHR, WebSocket and NetInfo in platforms/web/* //
///////////////////////////////////////////////////
module.exports = {
  entry: "./src/pusher",
  output: {
    library: "Pusher",
    path: path.join(__dirname, "../bundle/web"),
    filename: "pusher.js"
  },
  externals: {
    '../package': '{version: "'+ version +'"}'
  },
  plugins: [
    new NormalModuleReplacementPlugin(
      /^pusher-websocket-js-iso-externals-node\/ws$/,
      "pusher-websocket-js-iso-externals-web/ws"
    ),
    new NormalModuleReplacementPlugin(
      /^pusher-websocket-js-iso-externals-node\/xhr$/,
      "pusher-websocket-js-iso-externals-web/xhr"
    ),
    new NormalModuleReplacementPlugin(
      /^pusher-websocket-js-iso-externals-node\/net_info$/,
      "pusher-websocket-js-iso-externals-web/net_info"
    )
  ]
}
