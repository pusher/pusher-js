var baseConfig = require('../../../webpack/config.node');
var path = require('path');

baseConfig.entry = __dirname + '/../../javascripts/unit/index.node';

baseConfig.output = {
    filename: "unit_tests_spec.js",
    path: __dirname +"/../../../tmp/node_unit",
    libraryTarget: "var"
},

baseConfig.externals.testenv = "'node'";
baseConfig.resolve.modulesDirectories.push('spec/javascripts/helpers')

module.exports = baseConfig;
