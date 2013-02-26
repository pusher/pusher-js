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

  prototype.connect = function(callback) {
    if (!this.isSupported()) {
      return null;
    }

    var strategy = this.strategy;
    var abort = function() {
      clearTimeout(timer);
      timer = null;
    };
    var timer = setTimeout(function() {
      if (timer === null) {
        // hack for misbehaving clearTimeout in IE < 9
        return;
      }
      timer = null;
      abort = strategy.connect(callback).abort;
    }, this.options.delay);

    return {
      abort: function() {
        abort();
      }
    };
  };

  Pusher.DelayedStrategy = DelayedStrategy;
}).call(this);
