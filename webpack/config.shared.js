var webpack = require('webpack');
var fs = require('fs');

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
  plugins: [
    new webpack.BannerPlugin(fs.readFileSync('./src/core/pusher-licence.js', 'utf8'), {raw: true})
  ]
}
