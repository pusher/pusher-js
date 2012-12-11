;(function() {

  function DependencyLoader(options) {
    this.options = options;
    this.loading = {};
    this.loaded = {};
  }
  var prototype = DependencyLoader.prototype;

  prototype.load = function(name, callback) {
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

    require([path], function() {
      for (var i = 0; i < self.loading[name].length; i++) {
        self.loading[name][i]();
      }
      delete self.loading[name];
      self.loaded[name] = true;
    });
  };

  prototype.getRoot = function() {
    var cdn;
    if (document.location.protocol === "http:") {
      cdn = this.options.cdn_http;
    } else {
      cdn = this.options.cdn_https;
    }
    return cdn + "/" + this.options.version;
  };

  // helpers

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

  function require(src, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.setAttribute('src', src);
    script.setAttribute("type","text/javascript");
    script.setAttribute('async', true);

    handleScriptLoaded(script, function() {
      // workaround for an Opera issue
      setTimeout(callback, 0);
    });

    head.appendChild(script);
  }

  Pusher.DependencyLoader = DependencyLoader;

}).call(this);
