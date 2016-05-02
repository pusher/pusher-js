var webpack = require('webpack');
var fs = require('fs');
var version = require('../package').version;

module.exports = {
  entry: {
    pusher: "./src/core/index",
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ]
  },
  externals: {
    'version': "'"+version+"'"
  },
  plugins: [
    new webpack.BannerPlugin(fs.readFileSync('./src/core/pusher-licence.js', 'utf8').replace("<VERSION>", version), {raw: true})
  ]
}
