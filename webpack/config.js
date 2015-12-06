var path = require("path");
var StringReplacePlugin = require('string-replace-webpack-plugin');

var libConfig = require('./library_config')[process.env.ENVIRONMENT || "development"];

module.exports = {
  entry: "./src/pusher",
  output: {
    library: "Pusher",
    path: path.join(__dirname, "../bundle"),
    filename: "pusher.js"
  },
  externals: {
    "ws": "window.WebSocket || window.MozWebSocket"
  },
  resolve: {
    root: ["./src/context"]
  },
  module: {
    loaders: [
      {
        loader: StringReplacePlugin.replace({
          replacements: [
            {
              pattern: /<VERSION>/ig,
              replacement: function() {
                var packageJSON = require('../package');
                return packageJSON.version;
              }
            },
            {
              pattern: /<CDN_HTTP>/ig,
              replacement: function(){
                return libConfig.js.cdn.http;
              }
            },
            {
              pattern: /<CDN_HTTPS>/ig,
              replacement: function(){
                return libConfig.js.cdn.https;
              }
            }
          ]
        })
      }
    ],
  },
  plugins: [
    new StringReplacePlugin()
  ]
}