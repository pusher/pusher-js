'use strict';

var webpack = require('webpack');
var fs = require('fs');
var path = require('path');
var Config = require('./hosting_config');

var mode = process.env.NODE_ENV || 'production';
module.exports = {
  mode: mode,
  entry: {
    pusher: "./src/core/index",
  },
  context: path.resolve(__dirname, '..'),
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.js'],
  },
  module: {
    rules: [
      { test: /\.ts$/, loader: 'ts-loader' },
      { test: /\.js/, loader: 'babel-loader?presets[]=es2015' },
    ]
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: fs.readFileSync('./src/core/pusher-licence.js', 'utf8').replace("<VERSION>", Config.version),
      raw: true
    }),
    new webpack.DefinePlugin({
      "__VERSION__": JSON.stringify(Config.version),
      "__CDN_HTTP__": JSON.stringify(Config.cdn_http),
      "__CDN_HTTPS__": JSON.stringify(Config.cdn_https),
      "__DEPENDENCY_SUFFIX__": JSON.stringify(Config.dependency_suffix)
    })
  ]
}

