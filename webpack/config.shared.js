'use strict';

var webpack = require('webpack');
var fs = require('fs');
var Config = require('./hosting_config');

var mode = process.env.WEBPACK_MODE || 'production';
module.exports = {
  mode: mode,
  devtool: false,
  entry: {
    pusher: "./src/core/index",
  },
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader',
            options: { presets: [[ 'minify', {builtIns: false} ]] }
          },
          {loader: 'ts-loader' },
        ]
      },
      {
        test: /\.js$/,
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['minify', {builtIns: false}]
            ]
          }
      },
    ]
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: fs.readFileSync('./src/core/pusher-licence.js', 'utf8').replace("<VERSION>", Config.version),
      raw: true
    }),
    new webpack.DefinePlugin({
      "<VERSION>": Config.version,
      "<CDN_HTTP>": Config.cdn_http,
      "<CDN_HTTPS>": Config.cdn_https,
      "<DEPENDENCY_SUFFIX>": Config.dependency_suffix
    })
  ]
}
