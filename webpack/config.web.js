var path = require("path");
var StringReplacePlugin = require('string-replace-webpack-plugin');

module.exports = {
  entry: "./src/pusher",
  output: {
    library: "Pusher",
    path: path.join(__dirname, "../bundle/web"),
    filename: "pusher.js"
  },
  resolve: {
    modulesDirectories: ["node_modules", "src/platforms/web"]
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