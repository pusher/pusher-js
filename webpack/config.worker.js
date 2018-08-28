var path = require("path");
var NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;
var version = require('../package').version;
var objectAssign = require('object-assign-deep');
var webpack = require('webpack');

/*
  Upon importing the 'runtime' module, this worker build is made to look at
  src/runtimes/worker/runtime.ts by the below webpack resolution config.
  This is achieved by adding 'src/runtimes/worker' to the resolve.modulesDirectories array

  -- CONVENIENCE --
  We also add 'src/runtimes' to the list for convenient referencing of 'isomorphic/' implementations.
  We also add 'src/' so that the runtimes/worker folder can conveniently import 'core/' modules.
*/
var config = objectAssign(require('./config.shared'),{
  output: {
    library: "Pusher",
    path: path.join(__dirname, "../dist/worker"),
    filename: "pusher.worker.js"
  },
  resolve: {
    modulesDirectories: ['src/', 'src/runtimes/worker', 'src/runtimes']
  },
  plugins: [
    new webpack.DefinePlugin({
      global: "self"
    })
  ]
});

/*
We want the file to be called pusher.worker.js and not pusher.js
*/
config.entry = {
  "pusher.worker": "./src/core/index",
};

module.exports = config;
