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
    var strategy = this.strategy;
    var runner;
    var timer = new Pusher.Timer(this.options.delay, function() {
      runner = strategy.connect(minPriority, callback);
    });

    return {
      abort: function() {
        timer.ensureAborted();
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
