const { merge } = require('webpack-merge');
const path = require('path');
const baseConfig = require('../../../webpack/config.node');

module.exports = merge({}, baseConfig, {
  entry: {
    pusher: path.join(
      __dirname,
      "..",
      "..",
      "javascripts",
      "integration",
      "index.node"
    )
  },
  output: {
    filename: "integration_tests_spec.js",
    path: path.join(__dirname, "..", "..", "..", "tmp", "node_integration"),
    libraryTarget: "var"
  },
  resolve: {
    modules: ['spec/javascripts/helpers'],
    alias: {
      pusher_integration: 'core/pusher.js',
      integration: 'node/integration',
      'dom/dependencies': 'node/mock-dom-dependencies',
      'dom/dependency_loader': 'node/mock-dom-dependencies'
    },
  },
  externals: {
    testenv: "'node'"
  }
});
