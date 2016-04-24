var path = require("path");
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;
var version = require('../package').version;
var objectAssign = require('object-assign-deep');

///////////////////////////////////////////////////
// The web build uses:                           //
// XHR, WebSocket and NetInfo in platforms/web/* //
///////////////////////////////////////////////////
module.exports = objectAssign(require('./config.web'), {
  output: {
    path: path.join(__dirname, "../dist/web-umd"),
    libraryTarget: "umd"
  }
});
