'use strict';

var webpack = require('webpack');
var fs = require('fs');
var StringReplacePlugin = require("string-replace-webpack-plugin");
var Config = require('./hosting_config');

var lookup = {
  "<VERSION>": Config.version,
  "<CDN_HTTP>": Config.cdn_http,
  "<CDN_HTTPS>": Config.cdn_https,
  "<DEPENDENCY_SUFFIX>": Config.dependency_suffix
};

var replacements = [];

for (let i of Object.keys(lookup)) {
  replacements.push({
    pattern: i,
    replacement: function() {
      return lookup[i];
    }
  });
}

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
        loader: StringReplacePlugin.replace({replacements: replacements})
      },
      { test : /\.js$/, loader: 'es3ify-loader'}
    ]
  },
  plugins: [
    new webpack.BannerPlugin(fs.readFileSync('./src/core/pusher-licence.js', 'utf8').replace("<VERSION>", Config.version), {raw: true}),
    new StringReplacePlugin()
  ]
}
