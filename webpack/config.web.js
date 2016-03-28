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
  entry: "./src/pusher",
  output: {
    library: "Pusher",
    path: path.join(__dirname, "../dist/web"),
    filename: "pusher.js"
  },
  externals: {
    '../package': '{version: "'+ version +'"}'
  },
  plugins: [
    new NormalModuleReplacementPlugin(
      /^pusher-websocket-iso-externals-node\/app$/,
      "pusher-websocket-iso-externals-web/app"
    ),
    new NormalModuleReplacementPlugin(
      /^pusher-websocket-iso-externals-node\/ws$/,
      "pusher-websocket-iso-externals-web/ws"
    ),
    new NormalModuleReplacementPlugin(
      /^pusher-websocket-iso-externals-node\/xhr$/,
      "pusher-websocket-iso-externals-web/xhr"
    ),
    new NormalModuleReplacementPlugin(
      /^pusher-websocket-iso-externals-node\/net_info$/,
      "pusher-websocket-iso-externals-web/net_info"
    )
  ]
});

module.exports = config;
