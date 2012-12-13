;(function() {
  /** Launches all substrategies at the same time and uses the first connected.
   *
   * After establishing the connection, aborts all substrategies so that no
   * other attempts are made later.
   *
   * @param {Array} substrategies
   */
  function FirstConnectedStrategy(substrategies) {
    Pusher.AbstractMultiStrategy.call(this, substrategies);
  }
  var prototype = FirstConnectedStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.AbstractMultiStrategy.prototype);

  prototype.name = "first_connected";

  /** Launches a connection attempt and returns a strategy runner.
   *
   * @param  {Function} callback
   * @return {Object} strategy runner
   */
  prototype.connect = function(callback) {
    if (!this.isSupported()) {
      return null;
    }

    var runners = [];
    for (var i = 0; i < this.substrategies.length; i++) {
      runners.push(
        this.substrategies[i].connect(this.getCallback(i, runners, callback))
      );
    }

    var self = this;
    return {
      abort: function() {
        self.abortRunners(runners);
      }
    };
  };

  /** @protected */
  prototype.getCallback = function(i, runners, callback) {
    var self = this;

    return function(error, connection) {
      runners[i].error = error;
      if (error) {
        if (self.allFailed(runners)) {
          callback(true);
        }
        return;
      }
      self.abortRunners(runners);
      callback(null, connection);
    };
  };

  /** @protected */
  prototype.allFailed = function(runners) {
    for (var i = 0; i < runners.length; i++) {
      if (!runners[i].error) {
        return false;
      }
    }
    return true;
  };

  /** @protected */
  prototype.abortRunner = function(runners, i) {
    if (!runners[i].error && !runners[i].aborted) {
      runners[i].abort();
      runners[i].aborted = true;
    }
  };

  /** @protected */
  prototype.abortRunners = function(runners) {
    for (var i = 0; i < runners.length; i++) {
      this.abortRunner(runners, i);
    }
  };

  Pusher.FirstConnectedStrategy = FirstConnectedStrategy;
}).call(this);
