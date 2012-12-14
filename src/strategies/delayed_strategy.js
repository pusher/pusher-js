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
    Pusher.Strategy.call(this, Pusher.Strategy.filterUnsupported([strategy]));
    this.delay = options.delay;
  }
  var prototype = DelayedStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.Strategy.prototype);

  prototype.name = "delayed";

  prototype.getOptions = function() {
    return { delay: this.delay };
  }

  prototype.getEncrypted = function() {
    return new DelayedStrategy(
      this.strategies[0].getEncrypted(), this.getOptions()
    );
  };

  /** Launches a connection attempt and returns a strategy runner.
   *
   * @param  {Function} callback
   * @return {Object} strategy runner
   */
  prototype.connect = function(callback) {
    if (!this.isSupported()) {
      return null;
    }

    var self = this;
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
      abort = self.strategies[0].connect(callback).abort;
    }, this.delay);

    return {
      abort: function() {
        abort();
      }
    };
  };

  Pusher.DelayedStrategy = DelayedStrategy;
}).call(this);
