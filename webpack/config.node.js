var path = require("path");
var objectAssign = require('object-assign-deep');
var sharedConfig = require('./config.shared');

module.exports = objectAssign(sharedConfig, {
  output: {
    library: "Pusher",
    libraryTarget:"commonjs2",
    path: path.join(__dirname, "../dist/node"),
    filename: "pusher.js"
  },
  target: "node",
  resolve: {
    modules: ['src/runtimes/node']
  },
});
