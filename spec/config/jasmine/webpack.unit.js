const { merge } = require('webpack-merge');
const path = require('path');
const baseConfig = require('../../../webpack/config.node');

module.exports =  merge({}, baseConfig, {
  entry: {
    pusher: path.join(
      __dirname,
      "..",
      "..",
      "javascripts",
      "unit",
      "index.node"
    )
  },
  output: {
    filename: "unit_tests_spec.js",
    path: path.join(__dirname, "..", "..", "..", "tmp", "node_unit"),
    libraryTarget: "var"
  },
  externals: {
    testenv: "'node'"
  },
  resolve: {
    modules: ['spec/javascripts/helpers'],
    alias: {
      "dom/dependencies": "node/mock-dom-dependencies"
    }
  }
});
