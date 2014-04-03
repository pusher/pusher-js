;(function() {
  Pusher.DependenciesReceivers = new Pusher.ScriptReceiverFactory(
    "_pusher_dependencies", "Pusher.DependenciesReceivers"
  );
  Pusher.Dependencies = new Pusher.DependencyLoader({
    cdn_http: Pusher.cdn_http,
    cdn_https: Pusher.cdn_https,
    version: Pusher.VERSION,
    suffix: Pusher.dependency_suffix,
    receivers: Pusher.DependenciesReceivers
  });

  function initialize() {
    Pusher.ready();
  }

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

  function initializeOnDocumentBody() {
    onDocumentBody(initialize);
  }

  if (!window.JSON) {
    Pusher.Dependencies.load("json2", initializeOnDocumentBody);
  } else {
    initializeOnDocumentBody();
  }
})();
