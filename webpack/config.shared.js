var webpack = require('webpack');
var fs = require('fs');
var version = require('../package').version;
var StringReplacePlugin = require("string-replace-webpack-plugin");

module.exports = {
  entry: {
    pusher: "./src/core/index",
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' },
      {
        test: /.*/,
        loader: StringReplacePlugin.replace({
          replacements: [
            {
              pattern: "<VERSION>",
              replacement: function (match, p1, offset, string) {
                return version;
              }
            }
          ]})
        }
    ]
  },
  plugins: [
    new webpack.BannerPlugin(fs.readFileSync('./src/core/pusher-licence.js', 'utf8').replace("<VERSION>", version), {raw: true}),
    new StringReplacePlugin()
  ]
}
