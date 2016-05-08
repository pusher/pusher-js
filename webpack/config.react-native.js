var path = require("path");
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;
var version = require('../package').version;
var objectAssign = require('object-assign-deep');

/*
  Upon importing the 'runtime' module, this react-native build is made to look at
  src/runtimes/react-native/runtime.ts by the below webpack resolution config.
  This is achieved by adding 'src/runtimes/react-native' to the resolve.modulesDirectories array

  -- CONVENIENCE --
  We also add 'src/runtimes' to the list for convenient referencing of 'isomorphic/' implementations.
  We also add 'src/' so that the runtimes/react-native folder can conveniently import 'core/' modules.
*/
module.exports = objectAssign(require('./config.shared'),{
  output: {
    library: "Pusher",
    libraryTarget:"commonjs2",
    path: path.join(__dirname, "../dist/react-native"),
    filename: "pusher.js"
  },
  target: "node",
  externals: {
    "react-native": "react-native", // our Reachability implementation needs to reference react-native.
  },
  resolve: {
    modulesDirectories: ['src/', 'src/runtimes/react-native', 'src/runtimes']
  },
})
