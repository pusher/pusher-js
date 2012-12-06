;(function() {

  function SequentialStrategy(substrategies, options) {
    Pusher.AbstractMultiStrategy.call(this, substrategies);

    this.loop = options.loop;
    this.timeout = options.timeout;
    this.timeoutLimit = options.timeoutLimit;
  }
  var prototype = SequentialStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.AbstractMultiStrategy.prototype);

  // interface

  prototype.name = "seq";

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
      this.substrategies[current], this.timeout, tryNextStrategy
    );

    return {
      abort: function() {
        runner.abort();
      }
    };
  };

  // private

  prototype.tryStrategy = function(strategy, timeoutLength, callback) {
    var timeout = null;
    var runner = null;

    runner = strategy.connect(function(error, connection) {
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
