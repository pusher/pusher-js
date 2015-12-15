var path = require("path");
var StringReplacePlugin = require('string-replace-webpack-plugin');
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;
var pathToSource = require('./path_to_source');
var version = require('../package').version;

//////////////////////////////////////
// The worker build uses:           //
// WebSocket: platforms/web/ws      //
// XHR: platforms/web/xhr           //
// NetInfo: platforms/node/net_info //
//////////////////////////////////////
module.exports = {
  entry: "./src/pusher",
  output: {
    library: "Pusher",
    path: path.join(__dirname, "../bundle/worker"),
    filename: "pusher.js"
  },
  externals: {
    '../package': '{version: "'+ version +'"}'
  },
  plugins: [
    new StringReplacePlugin(),
    new NormalModuleReplacementPlugin(
      /^pusher-websocket-js-iso-externals-node\/ws$/,
      "pusher-websocket-js-iso-externals-web/ws"
    ),
    new NormalModuleReplacementPlugin(
      /^pusher-websocket-js-iso-externals-node\/xhr$/,
      "pusher-websocket-js-iso-externals-web/xhr"
    )
  ]
}
