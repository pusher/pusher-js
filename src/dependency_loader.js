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

    if (self.loaded[name]) {
      callback(null);
    } else if (self.loading[name] && self.loading[name].length > 0) {
      self.loading[name].push(callback);
    } else {
      self.loading[name] = [callback];

      require(
        self.getPath(name),
        self.options.receivers,
        function(error) {
          if (!error) {
            self.loaded[name] = true;
          }

          if (self.loading[name]) {
            for (var i = 0; i < self.loading[name].length; i++) {
              self.loading[name][i](error);
            }
            delete self.loading[name];
          }
        }
      );
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

  function require(src, receivers, callback) {
    var receiver = receivers.create(function(error) {
      if (error) {
        request.cleanup();
      }
      receivers.remove(receiver);
      callback(error);
    });
    var request = new Pusher.ScriptRequest(src, receiver);
    request.send();
  }

  Pusher.DependencyLoader = DependencyLoader;
}).call(this);
