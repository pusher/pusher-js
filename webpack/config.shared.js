'use strict';

var webpack = require('webpack');
var Config = require('./hosting_config');
var fs = require('fs');

var banner = fs
  .readFileSync("./src/core/pusher-licence.js", "utf8")
  .replace("<VERSION>", Config.version);

// This is the base webpack config for all runtimes. Runtime specific webpack
// configs will overwrite/append keys where necessary. 

module.exports = {
  mode: process.env.MODE || "production",
  entry: {
    pusher: "./src/core/index",
  },
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.js'],
    modules: ['src', 'src/runtimes', 'node_modules'],
  },
  module: {
    rules: [
      { test: /\.ts$/, loader: 'ts-loader' },
    ],
  },
  plugins: [
    new webpack.BannerPlugin({banner:  banner, raw: true}),
    new webpack.DefinePlugin({
      "VERSION": JSON.stringify(Config.version),
      "CDN_HTTP": JSON.stringify(Config.cdn_http),
      "CDN_HTTPS": JSON.stringify(Config.cdn_https),
      "DEPENDENCY_SUFFIX": JSON.stringify(Config.dependency_suffix)
    })
  ]
}
