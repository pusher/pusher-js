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

// Allows calling a function when the document body is available
 function onDocumentBody(callback) {
  if (document.body) {
    callback();
  } else {
    setTimeout(function() {
      onDocumentBody(callback);
    }, 0);
  }
}

Dependencies.preparePusher = function(initialize){
  if (!window.JSON) {
    Dependencies.load("json2", {}, function(){
      onDocumentBody(initialize);
    });
  } else {
      onDocumentBody(initialize);
  }
}

module.exports = Dependencies;
