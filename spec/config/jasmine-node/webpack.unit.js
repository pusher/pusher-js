var objectAssign = require("object-assign-deep");
var webpack = require("webpack");
var baseConfig = require("../../../webpack/config.node");
var path = require("path");
var dummyDependencies = {};

module.exports =  objectAssign({}, baseConfig, {
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
