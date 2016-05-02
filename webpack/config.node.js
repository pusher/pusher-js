var path = require("path");
var objectAssign = require('object-assign-deep');

module.exports = objectAssign(require('./config.shared'), {
  output: {
    library: "Pusher",
    libraryTarget:"commonjs2",
    path: path.join(__dirname, "../dist/node"),
    filename: "pusher.js"
  },
  target: "node",
  resolve: {
    modulesDirectories: ['node_modules', 'web_modules', 'src/', 'src/runtimes/node', 'src/runtimes']
  },
  externals: {
    "faye-websocket": "commonjs faye-websocket",
    "xmlhttprequest": "commonjs xmlhttprequest"
  }
});
