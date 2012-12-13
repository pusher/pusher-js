;(function() {
  /** Runs substrategy after specified delay.
   *
   * Options:
   * - delay - time in miliseconds to delay the substrategy attempt
   *
   * @param {Strategy} substrategy
   * @param {Object} options
   */
  function DelayedStrategy(substrategy, options) {
    this.substrategy = substrategy;
    this.delay = options.delay;
  }
  var prototype = DelayedStrategy.prototype;

  prototype.name = "delayed";

  /** Checks whether the substrategy is supported.
   *
   * @returns {Boolean}
   */
  prototype.isSupported = function() {
    return this.substrategy.isSupported();
  };

  /** Creates an encrypted-only copy of itself, respecting the delay.
   *
   * @returns {DelayedStrategy}
   */
  prototype.getEncrypted = function() {
    return new DelayedStrategy(
      this.substrategy.getEncrypted(),
      { delay: this.delay }
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
      abort = self.substrategy.connect(callback).abort;
    }, this.delay);

    return {
      abort: function() {
        abort();
      }
    };
  };

  Pusher.DelayedStrategy = DelayedStrategy;
}).call(this);
