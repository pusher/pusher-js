'use strict';

var webpack = require('webpack');
var fs = require('fs');
var Config = require('./hosting_config');
var banner = fs.readFileSync('./src/core/pusher-licence.js', 'utf8');
banner = banner.replace('<VERSION>', Config.version);

var minimize = process.env.MINIMIZE === 'false' ? false : true;

module.exports = {
  mode: process.env.MODE || 'production',
  optimization: {
    minimize: minimize
  },
  entry: {
    pusher: './src/core/pusher.js'
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.js'],
    // add runtimes for easier importing of isomorphic runtime modules
    modules: ['src', 'src/runtimes', 'node_modules']
  },
  module: {
    rules: [
      { test: /\.ts$/, loader: 'ts-loader' },
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader']
      }
    ]
  },
  node: {
    // nacl uses Buffer on node.js but has a different code path for the browser.
    // We don't need webpack to include a Buffer polyfill when seeing the usage,
    // as it won't be used.
    Buffer: false
  },
  plugins: [
    new webpack.BannerPlugin({ banner: banner, raw: true }),
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(Config.version),
      CDN_HTTP: JSON.stringify(Config.cdn_http),
      CDN_HTTPS: JSON.stringify(Config.cdn_https),
      DEPENDENCY_SUFFIX: JSON.stringify(Config.dependency_suffix)
    })
  ]
};
