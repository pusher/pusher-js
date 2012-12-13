;(function() {
  /** Loops through substrategies with optional timeouts.
   *
   * Options:
   * - loop - whether it should loop through the substrategy list
   * - timeout - initial timeout for a single substrategy
   * - timeoutLimit - maximum timeout
   *
   * @param {Strategy} substrategy
   * @param {Object} options
   */
  function SequentialStrategy(substrategies, options) {
    Pusher.AbstractMultiStrategy.call(this, substrategies);

    this.loop = options.loop;
    this.timeout = options.timeout;
    this.timeoutLimit = options.timeoutLimit;
  }
  var prototype = SequentialStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.AbstractMultiStrategy.prototype);

  prototype.name = "seq";

  /** Creates an encrypted-only copy of itself, copying all options.
   *
   * @returns {SequentialStrategy}
   */
  prototype.getEncrypted = function() {
    var substrategies = [];
    for (var i = 0; i < this.substrategies.length; i++) {
      substrategies.push(this.substrategies[i].getEncrypted());
    }
    return new this.constructor(substrategies, {
      loop: this.loop,
      timeout: this.timeout,
      timeoutLimit: this.timeoutLimit
    });
  };

  /** Launches a connection attempt and returns a strategy runner.
   *
   * @param  {Function} callback
   * @return {Object} strategy runner
   */
  prototype.connect = function(callback) {
    var self = this;

    var current = 0;
    var timeout = self.timeout;
    var runner = null;

    var tryNextStrategy = function(error, connection) {
      if (connection) {
        callback(null, connection);
      } else {
        current = current + 1;
        if (self.loop) {
          current = current % self.substrategies.length;
        }

        if (current < self.substrategies.length) {
          if (timeout) {
            timeout = timeout * 2;
            if (self.timeoutLimit) {
              timeout = Math.min(timeout, self.timeoutLimit);
            }
          }
          runner = self.tryStrategy(
            self.substrategies[current], timeout, tryNextStrategy
          );
        } else {
          callback(true);
        }
      }
    };

    runner = this.tryStrategy(
      this.substrategies[current], timeout, tryNextStrategy
    );

    return {
      abort: function() {
        runner.abort();
      }
    };
  };

  /** @private */
  prototype.tryStrategy = function(strategy, timeoutLength, callback) {
    var timeout = null;
    var runner = null;

    runner = strategy.connect(function(error, connection) {
      if (error) {
        // advance to the next strategy after the timeout
        return;
      }
      if (timeout) {
        clearTimeout(timeout);
      }
      callback(error, connection);
    });

    if (timeoutLength > 0) {
      timeout = setTimeout(function() {
        runner.abort();
        callback(true);
      }, timeoutLength);
    }

    return runner;
  };

  Pusher.SequentialStrategy = SequentialStrategy;
}).call(this);
