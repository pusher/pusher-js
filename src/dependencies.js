var DependencyLoader = require('./dependency_loader');
var Defaults = require('./defaults');
var DependenciesReceivers = require('./dependencies_receivers');

var Dependencies = new DependencyLoader({
  cdn_http: Defaults.cdn_http,
  cdn_https: Defaults.cdn_https,
  version: Defaults.VERSION,
  suffix: Defaults.dependency_suffix,
  receivers: DependenciesReceivers
});

module.exports = Dependencies;
