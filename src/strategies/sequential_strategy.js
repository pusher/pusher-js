;(function() {

  function SequentialStrategy(substrategies, options) {
    Pusher.EventsDispatcher.call(this);

    this.substrategies = substrategies;
    this.options = options || {};
  };
  var prototype = SequentialStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  // interface

  prototype.name = "seq";

  prototype.isSupported = function() {
    return this.getSupported().length > 0;
  };

  prototype.initialize = function() {
    var strategies = this.getSupported();

    for (var i = 0; i < strategies.length; i++) {
      strategies[i].initialize();
    }
  };

  prototype.connect = function() {
    if (this.abortCallback) {
      return false;
    }

    var self = this;

    var strategies = this.getSupported();
    var current = 0;
    var timeout = this.options.timeout;

    var tryNextStrategy = function(error, connection) {
      if (connection) {
        self.emit("open", connection);
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
          this.abortCallback = self.tryStrategy(
            strategies[current], timeout, tryNextStrategy
          );
        } else {
          self.emit("error");
        }
      }
    };

    this.abortCallback = this.tryStrategy(
      strategies[current], this.options.timeout, tryNextStrategy
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

  prototype.getSupported = function() {
    var supported = [];
    for (var i = 0; i < this.substrategies.length; i++) {
      if (this.substrategies[i].isSupported()) {
        supported.push(this.substrategies[i]);
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
