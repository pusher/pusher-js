var path = require("path");
var objectAssign = require("object-assign-deep");
var configShared = require("./config.shared");

module.exports = objectAssign({}, configShared, {
  output: {
    library: "Pusher",
    libraryTarget: "commonjs2",
    path: path.join(__dirname, "../dist/node"),
    filename: "pusher.js"
  },
  target: "node",
  resolve: {
    // in order to import the appropriate runtime.ts
    modules: ["src/runtimes/node"]
  }
});
