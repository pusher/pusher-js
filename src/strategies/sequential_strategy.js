;(function() {

  function SequentialStrategy(substrategies, options) {
    Pusher.AbstractMultiStrategy.call(this, substrategies, options);
  }
  var prototype = SequentialStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.AbstractMultiStrategy.prototype);

  // interface

  prototype.name = "seq";

  prototype.connect = function() {
    if (this.abortCallback) {
      return false;
    }

    var self = this;

    var current = 0;
    var timeout = this.options.timeout;

    var tryNextStrategy = function(error, connection) {
      self.abortCallback = null;
      if (connection) {
        self.emit("open", connection);
      } else {
        current = current + 1;
        if (self.options.loop) {
          current = current % self.substrategies.length;
        }

        if (current < self.substrategies.length) {
          if (timeout) {
            timeout = timeout * 2;
            if (self.options.timeoutLimit) {
              timeout = Math.min(timeout, self.options.timeoutLimit);
            }
          }
          self.abortCallback = self.tryStrategy(
            self.substrategies[current], timeout, tryNextStrategy
          );
        } else {
          self.emit("error");
        }
      }
    };

    this.abortCallback = this.tryStrategy(
      this.substrategies[current], this.options.timeout, tryNextStrategy
    );

    return true;
  };

  // private

  prototype.tryStrategy = function(strategy, timeoutLength, callback) {
    var onOpen = function(connection) {
      unbindListeners();
      callback(null, connection);
    };
    var onError = function(error) {
      unbindListeners();
      callback(error);
    };
    var onTimeout = function() {
      strategy.abort();
      unbindListeners();
      callback("timeout");
    };

    var unbindListeners = function() {
      strategy.unbind("open", onOpen);
      strategy.unbind("error", onError);
      if (timeout) {
        clearTimeout(timeout);
      }
    };

    var abortCallback = function() {
      strategy.abort();
      unbindListeners();
    };

    strategy.bind("open", onOpen);
    strategy.bind("error", onError);

    strategy.connect();

    if (timeoutLength > 0) {
      var timeout = setTimeout(onTimeout, timeoutLength);
    }

    return abortCallback;
  };

  Pusher.SequentialStrategy = SequentialStrategy;
}).call(this);
