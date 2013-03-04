;(function() {
  /** Runs substrategy after specified delay.
   *
   * Options:
   * - delay - time in miliseconds to delay the substrategy attempt
   *
   * @param {Strategy} strategy
   * @param {Object} options
   */
  function DelayedStrategy(strategy, options) {
    this.strategy = strategy;
    this.options = { delay: options.delay };
  }
  var prototype = DelayedStrategy.prototype;

  prototype.isSupported = function() {
    return this.strategy.isSupported();
  };

  prototype.connect = function(minPriority, callback) {
    if (!this.isSupported()) {
      return null;
    }

    var strategy = this.strategy;
    var runner;
    var timer = setTimeout(function() {
      if (timer === null) {
        // hack for misbehaving clearTimeout in IE < 9
        return;
      }
      timer = null;
      runner = strategy.connect(minPriority, callback);
    }, this.options.delay);

    return {
      abort: function() {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        if (runner) {
          runner.abort();
        }
      },
      forceMinPriority: function(p) {
        minPriority = p;
        if (runner) {
          runner.forceMinPriority(p);
        }
      }
    };
  };

  Pusher.DelayedStrategy = DelayedStrategy;
}).call(this);
