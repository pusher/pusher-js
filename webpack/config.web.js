var path = require("path");
var webpack = require('webpack');
var NormalModuleReplacementPlugin = webpack.NormalModuleReplacementPlugin;
var objectAssign = require('object-assign-deep');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

/*
  Upon importing the 'runtime' module, this web build is made to look at
  src/runtimes/web/runtime.ts by the below webpack resolution config.
  This is achieved by adding 'src/runtimes/web' to the resolve.modulesDirectories array

  -- CONVENIENCE --
  We also add 'src/runtimes' to the list for convenient referencing of 'isomorphic/' implementations.
  We also add 'src/' so that the runtimes/web folder can conveniently import 'core/' modules.
*/
var mode = process.env.NODE_ENV || 'production';
var config = objectAssign(require('./config.shared'),{
  output: {
    library: "Pusher",
    path: path.join(__dirname, "../dist/web"),
    libraryTarget: "umd"
  },
  resolve: {
    modules: ['src/', 'src/runtimes/web', 'src/runtimes', 'node_modules'],
    alias: {
      'tweetnacl': path.resolve(__dirname, '../node_modules/tweetnacl/nacl.min.js'),
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      global: "window"
    })
  ],
  optimization: {
    minimizer: [new UglifyJsPlugin()]
  },
});

if(mode === "production") {
  config.output.filename = "pusher.min.js"
  config.optimization = {
    minimizer: [new UglifyJsPlugin()]
  }
} else {
  config.output.filename = "pusher.js"
}

module.exports = config;
