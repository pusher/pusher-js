var path = require("path");
var objectAssign = require('object-assign-deep');

module.exports = objectAssign(require('./config.shared'), {
  entry: "./src/pusher",
  output: {
    library: "Pusher",
    libraryTarget:"commonjs2",
    path: path.join(__dirname, "../dist/node"),
    filename: "pusher.js"
  },
  target: "node",
  externals: {
    "faye-websocket": "commonjs faye-websocket",
    "xmlhttprequest": "commonjs xmlhttprequest"
  }
});
