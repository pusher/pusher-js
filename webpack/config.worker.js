var path = require("path");
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;
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
    path: path.join(__dirname, "../dist/worker"),
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
    )
  ]
}
