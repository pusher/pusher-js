var path = require("path");
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;
var version = require('../package').version;
var objectAssign = require('object-assign-deep');

//////////////////////////////////////
// The worker build uses:           //
// WebSocket: platforms/web/ws      //
// XHR: platforms/web/xhr           //
// NetInfo: platforms/node/net_info //
//////////////////////////////////////
module.exports = objectAssign(require('./config.shared'),{
  output: {
    library: "Pusher",
    path: path.join(__dirname, "../dist/worker"),
    filename: "pusher.js"
  },
  externals: {
    '../package': '{version: "'+ version +'"}'
  },
  resolve: {
    modulesDirectories: ['node_modules', 'web_modules', 'src/', 'src/runtimes/worker', 'src/runtimes']
  }
})
