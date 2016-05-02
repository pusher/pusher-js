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
  output: {
    library: "Pusher",
    libraryTarget:"commonjs2",
    path: path.join(__dirname, "../dist/react-native"),
    filename: "pusher.js"
  },
  target: "node",
  externals: {
    "react-native": "react-native",
  },
  resolve: {
    modulesDirectories: ['node_modules', 'web_modules', 'src/', 'src/runtimes/react-native', 'src/runtimes']
  },
})
