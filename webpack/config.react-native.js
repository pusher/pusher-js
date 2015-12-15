var path = require("path");
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;
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
    path: path.join(__dirname, "../dist/react-native"),
    filename: "pusher.js"
  },
  target: "node",
  externals: {
    "react-native": "{}",
    '../package': 'var {version: "'+ version +'"}'
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
      "pusher-websocket-js-iso-externals-react-native/net_info"
    )
  ]
}
