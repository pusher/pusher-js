var path = require("path");
var objectAssign = require('object-assign-deep');

/*
  Upon importing the 'runtime' module, this node build is made to look at
  src/runtimes/node/runtime.ts by the below webpack resolution config.
  This is achieved by adding 'src/runtimes/node' to the resolve.modulesDirectories array

  -- CONVENIENCE --
  We also add 'src/runtimes' to the list for convenient referencing of 'isomorphic/' implementations.
  We also add 'src/' so that the runtimes/node folder can conveniently import 'core/' modules.
*/
module.exports = objectAssign(require('./config.shared'), {
  output: {
    library: "Pusher",
    libraryTarget:"commonjs2",
    path: path.join(__dirname, "../dist/node"),
    filename: "pusher.js"
  },
  target: "node",
  resolve: {
    modulesDirectories: ['src/', 'src/runtimes/node', 'src/runtimes']
  },
  externals: {
    "faye-websocket": "commonjs faye-websocket",
    "xmlhttprequest": "commonjs xmlhttprequest"
  }
});
