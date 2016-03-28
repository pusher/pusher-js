var path = require("path");
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;
var version = require('../package').version;
var objectAssign = require('object-assign-deep');

//////////////////////////////////////////////
// The ReactNative build uses:              //
// WebSocket: platforms/web/ws              //
// XHR: platforms/web/xhr                   //
// NetInfo: platforms/react-native/net_info //
//////////////////////////////////////////////
module.exports = objectAssign(require('./config.shared'),{
  entry: "./src/pusher",
  output: {
    library: "Pusher",
    libraryTarget:"commonjs2",
    path: path.join(__dirname, "../dist/react-native"),
    filename: "pusher.js"
  },
  target: "node",
  externals: {
    "react-native": "react-native",
    '../package': 'var {version: "'+ version +'"}'
  },
  plugins: [
    new NormalModuleReplacementPlugin(
      /^pusher-websocket-iso-externals-node\/ws$/,
      "pusher-websocket-iso-externals-react-native/ws"
    ),
    new NormalModuleReplacementPlugin(
      /^pusher-websocket-iso-externals-node\/xhr$/,
      "pusher-websocket-iso-externals-react-native/xhr"
    ),
    new NormalModuleReplacementPlugin(
      /^pusher-websocket-iso-externals-node\/net_info$/,
      "pusher-websocket-iso-externals-react-native/net_info"
    )
  ]
})
