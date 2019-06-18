var baseConfig = require('../../../webpack/config.node');
var path = require('path');

baseConfig.entry = __dirname + '/../../javascripts/integration/index.node';

baseConfig.output = {
    filename: "integration_tests_spec.js",
    path: __dirname +"/../../../tmp/node_integration",
    libraryTarget: "var"
},

baseConfig.externals = baseConfig.externals || {}
baseConfig.externals.testenv = "'node'";
baseConfig.resolve.alias = {
  pusher_integration: 'core/index',
  integration: 'node/integration',
  'dom/dependencies': 'node/mock-dom-dependencies',
  'dom/dependency_loader': 'node/mock-dom-dependencies'
}

baseConfig.resolve.modules.push('spec/javascripts/helpers')

module.exports = baseConfig;
