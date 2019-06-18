var baseConfig = require('../../../webpack/config.node');
var webpack = require('webpack');
var path = require('path');
var dummyDependencies = {};

baseConfig.entry = __dirname + '/../../javascripts/unit/index.node';

baseConfig.output = {
    filename: "unit_tests_spec.js",
    path: __dirname +"/../../../tmp/node_unit",
    libraryTarget: "var"
};
baseConfig.externals = baseConfig.externals || {}
baseConfig.externals.testenv = "'node'";
baseConfig.resolve.modules.push('spec/javascripts/helpers')
baseConfig.resolve.alias = baseConfig.resolve.alias || {}
baseConfig.resolve.alias['dom/dependencies'] = 'node/mock-dom-dependencies'

module.exports = baseConfig;
