var path = require("path");
var StringReplacePlugin = require('string-replace-webpack-plugin');

module.exports = {
  entry: "./src/pusher",
  output: {
    library: "Pusher",
    libraryTarget:"commonjs2",
    path: path.join(__dirname, "../bundle/react-native"),
    filename: "pusher.js"
  },
  target: "node",
  resolve: {
    alias: {
      ws: path.join(__dirname, "../src") + "/platforms/web/ws.js",
      xhr: path.join(__dirname, "../src") +  "/platforms/web/xhr.js"
    },
    modulesDirectories: ["node_modules", "src/platforms/react-native"]
  },
  externals: {
    "react-native": "{}"
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