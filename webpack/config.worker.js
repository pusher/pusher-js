var path = require("path");
var StringReplacePlugin = require('string-replace-webpack-plugin');

module.exports = {
  entry: "./src/pusher",
  output: {
    library: "Pusher",
    path: path.join(__dirname, "../bundle/worker"),
    filename: "pusher.js"
  },
  resolve: {
    alias: {
      net_info: path.join(__dirname, "../src") + "/platforms/node/net_info.js",
    },
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