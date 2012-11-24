;(function() {

  function SequentialStrategy(substrategies, options) {
    Pusher.EventsDispatcher.call(this);

    this.substrategies = this.getSupported(substrategies);
    this.options = options || {};
  };
  var prototype = SequentialStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  // interface

  prototype.name = "seq";

  prototype.isSupported = function() {
    return this.substrategies.length > 0;
  };

  prototype.initialize = function() {
    for (var i = 0; i < this.substrategies.length; i++) {
      this.substrategies[i].initialize();
    }
  };

  prototype.connect = function() {
    if (this.abortCallback) {
      return false;
    }

    var self = this;

    var current = 0;
    var timeout = this.options.timeout;

    var tryNextStrategy = function(error, connection) {
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

  prototype.abort = function() {
    if (this.abortCallback) {
      this.abortCallback();
      this.abortCallback = null;
      return true;
    } else {
      return false;
    }
  };

  // private

  prototype.getSupported = function(substrategies) {
    var supported = [];
    for (var i = 0; i < substrategies.length; i++) {
      if (substrategies[i].isSupported()) {
        supported.push(substrategies[i]);
      }
    }
    return supported;
  }

  prototype.tryStrategy = function(strategy, timeoutLength, callback) {
    var onOpen = function(connection) {
      this.abortCallback = null;
      unbindListeners();
      callback(null, connection);
    };
    var onError = function(error) {
      this.abortCallback = null;
      unbindListeners();
      callback(error);
    };
    var onTimeout = function() {
      this.abortCallback = null;
      strategy.abort();
      unbindListeners();
      callback("timeout");
    };

    if (timeoutLength > 0) {
      var timeout = setTimeout(onTimeout, timeoutLength);
    }

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

    return abortCallback;
  };

  Pusher.SequentialStrategy = SequentialStrategy;
}).call(this);
