var path = require("path");
var StringReplacePlugin = require('string-replace-webpack-plugin');

module.exports = {
  entry: "./src/pusher",
  output: {
    library: "Pusher",
    libraryTarget:"commonjs2",
    path: path.join(__dirname, "../bundle/node"),
    filename: "pusher.js"
  },
  target: "node",
  resolve: {
    modulesDirectories: ["node_modules", "src/platforms/node"]
  },
  module: {
    loaders: [
      require('./gsub')
    ],
  },
  plugins: [
    new StringReplacePlugin()
  ]
}