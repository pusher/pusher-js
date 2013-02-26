;(function() {
  /** Loops through strategies with optional timeouts.
   *
   * Options:
   * - loop - whether it should loop through the substrategy list
   * - timeout - initial timeout for a single substrategy
   * - timeoutLimit - maximum timeout
   *
   * @param {Strategy[]} strategies
   * @param {Object} options
   */
  function SequentialStrategy(strategies, options) {
    Pusher.MultiStrategy.call(this, strategies, {
      loop: options.loop,
      failFast: options.failFast,
      timeout: options.timeout,
      timeoutLimit: options.timeoutLimit
    });
  }
  var prototype = SequentialStrategy.prototype;
  Pusher.Util.extend(prototype, Pusher.MultiStrategy.prototype);

  prototype.connect = function(minPriority, callback) {
    var self = this;

    var strategies = Pusher.MultiStrategy.filterUnsupported(this.strategies);
    var current = 0;
    var timeout = this.options.timeout;
    var runner = null;

    var tryNextStrategy = function(error, connection) {
      if (connection) {
        callback(null, connection);
      } else {
        current = current + 1;
        if (self.options.loop) {
          current = current % strategies.length;
        }

        if (current < strategies.length) {
          if (timeout) {
            timeout = timeout * 2;
            if (self.options.timeoutLimit) {
              timeout = Math.min(timeout, self.options.timeoutLimit);
            }
          }
          runner = self.tryStrategy(
            strategies[current],
            minPriority,
            { timeout: timeout, failFast: self.options.failFast },
            tryNextStrategy
          );
        } else {
          callback(true);
        }
      }
    };

    runner = this.tryStrategy(
      strategies[current],
      minPriority,
      { timeout: timeout, failFast: this.options.failFast },
      tryNextStrategy
    );

    return {
      abort: function() {
        runner.abort();
      },
      forceMinPriority: function(p) {
        minPriority = p;
        if (runner) {
          runner.forceMinPriority(p);
        }
      }
    };
  };

  /** @private */
  prototype.tryStrategy = function(strategy, minPriority, options, callback) {
    var timeout = null;
    var runner = null;

    runner = strategy.connect(minPriority, function(error, connection) {
      if (error && timeout && !options.failFast) {
        // advance to the next strategy after the timeout
        return;
      }
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      callback(error, connection);
    });

    if (options.timeout > 0) {
      timeout = setTimeout(function() {
        if (timeout) {
          runner.abort();
          callback(true);
        }
      }, options.timeout);
    }

    return {
      abort: function() {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        runner.abort();
      },
      forceMinPriority: function(p) {
        runner.forceMinPriority(p);
      }
    };
  };

  Pusher.SequentialStrategy = SequentialStrategy;
}).call(this);
