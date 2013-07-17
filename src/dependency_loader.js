;(function() {
  /** Handles loading dependency files.
   *
   * Options:
   * - cdn_http - url to HTTP CND
   * - cdn_https - url to HTTPS CDN
   * - version - version of pusher-js
   * - suffix - suffix appended to all names of dependency files
   *
   * @param {Object} options
   */
  function DependencyLoader(options) {
    this.options = options;
    this.loading = {};
    this.loaded = {};
  }
  var prototype = DependencyLoader.prototype;

  /** Loads the dependency from CDN.
   *
   * @param  {String} name
   * @param  {Function} callback
   */
  prototype.load = function(name, callback) {
    var self = this;

    if (this.loaded[name]) {
      callback();
    } else if (this.loading[name] && this.loading[name].length > 0) {
      this.loading[name].push(callback);
    } else {
      this.loading[name] = [callback];

      require(this.getPath(name), function() {
        self.loaded[name] = true;

        if (self.loading[name]) {
          for (var i = 0; i < self.loading[name].length; i++) {
            self.loading[name][i]();
          }
          delete self.loading[name];
        }
      });
    }
  };

  /** Returns a root URL for pusher-js CDN.
   *
   * @returns {String}
   */
  prototype.getRoot = function(options) {
    var cdn;
    var protocol = Pusher.Util.getDocumentLocation().protocol;
    if ((options && options.encrypted) || protocol === "https:") {
      cdn = this.options.cdn_https;
    } else {
      cdn = this.options.cdn_http;
    }
    // make sure there are no double slashes
    return cdn.replace(/\/*$/, "") + "/" + this.options.version;
  };

  /** Returns a full path to a dependency file.
   *
   * @param {String} name
   * @returns {String}
   */
  prototype.getPath = function(name, options) {
    return this.getRoot(options) + '/' + name + this.options.suffix + '.js';
  };

  function handleScriptLoaded(elem, callback) {
    if (Pusher.Util.getDocument().addEventListener) {
      elem.addEventListener('load', callback, false);
    } else {
      elem.attachEvent('onreadystatechange', function () {
        if (elem.readyState === 'loaded' || elem.readyState === 'complete') {
          callback();
        }
      });
    }
  }

  function require(src, callback) {
    var document = Pusher.Util.getDocument();
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
