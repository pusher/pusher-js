// _require(dependencies, callback) takes an array of dependency urls and a
// callback to call when all the dependecies have finished loading
var _require = (function() {
  function handleScriptLoaded(elem, callback) {
    if (document.addEventListener) {
      elem.addEventListener('load', callback, false);
    } else {
      elem.attachEvent('onreadystatechange', function () {
        if (elem.readyState == 'loaded' || elem.readyState == 'complete') {
          callback();
        }
      });
    }
  }

  function addScript(src, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.setAttribute('src', src);
    script.setAttribute("type","text/javascript");
    script.setAttribute('async', true);

    handleScriptLoaded(script, function() {
      callback();
    });

    head.appendChild(script);
  }

  return function(deps, callback) {
    var deps_loaded = 0;
    for (var i = 0; i < deps.length; i++) {
      addScript(deps[i], function() {
        if (deps.length == ++deps_loaded) {
          // This setTimeout is a workaround for an Opera issue
          setTimeout(callback, 0);
        }
      });
    }
  }
})();

;(function() {

  function DependencyLoader(options) {
    this.options = options;
    this.loading = {}
    this.loaded = {}
  }

  DependencyLoader.prototype = {
    load: function(name, callback) {
      var self = this;

      if (this.loaded[name]) {
        callback();
        return;
      }

      if (!this.loading[name]) {
        this.loading[name] = [];
      }
      this.loading[name].push(callback);
      if (this.loading[name].length > 1) {
        return;
      }

      var path = this.getRoot() + '/' + name + this.options.suffix + '.js';

      _require([path], function() {
        for (var i = 0; i < self.loading[name].length; i++) {
          self.loading[name][i]();
        }
        delete self.loading[name];
        self.loaded[name] = true;
      });
    },

    getRoot: function() {
      if (document.location.protocol == "http:") {
        var cdn = this.options.cdn_http;
      } else {
        var cdn = this.options.cdn_https;
      }
      return cdn + "/" + this.options.version;
    }
  };

  Pusher.Dependencies = new DependencyLoader({
    cdn_http: Pusher.cdn_http,
    cdn_https: Pusher.cdn_https,
    version: Pusher.VERSION,
    suffix: Pusher.dependency_suffix
  });

  // Support Firefox versions which prefix WebSocket
  if (!window['WebSocket'] && window['MozWebSocket']) {
    window['WebSocket'] = window['MozWebSocket']
  }

  var initialize = function() {
    Pusher.ready();
  };

  // Allows calling a function when the document body is available
  var ondocumentbody = function(callback) {
    var load_body = function() {
      document.body ? callback() : setTimeout(load_body, 0);
    }
    load_body();
  };

  var initializeOnDocumentBody = function() {
    ondocumentbody(initialize);
  }

  if (!window['JSON']) {
    Pusher.Dependencies.load("json2", initializeOnDocumentBody);
  } else {
    initializeOnDocumentBody();
  }
})();
