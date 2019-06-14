var path = require("path");
var webpack = require('webpack');
var NormalModuleReplacementPlugin = webpack.NormalModuleReplacementPlugin;
var objectAssign = require('object-assign-deep');
var sharedConfig = require('./config.shared');

/*
  Upon importing the 'runtime' module, this web build is made to look at
  src/runtimes/web/runtime.ts by the below webpack resolution config.
  This is achieved by adding 'src/runtimes/web' to the resolve.modules array

  -- CONVENIENCE --
  We also add 'src/runtimes' to the list for convenient referencing of 'isomorphic/' implementations.
  We also add 'src/' so that the runtimes/web folder can conveniently import 'core/' modules.
*/

var filename = process.env.MODE === "development" ?
  "pusher.js":
  "pusher.min.js";

var config = objectAssign(sharedConfig, {
  output: {
    library: "Pusher",
    path: path.join(__dirname, "../dist/web"),
    filename: filename,
    libraryTarget: "umd"
  },
  resolve: {
    modules: ['src/runtimes/web']
  },
  plugins: [
    new webpack.DefinePlugin({
      global: "window"
    })
  ]
});

module.exports = config;
