;(function() {

  function FirstSupportedStrategy(substrategies, options) {
    Pusher.EventsDispatcher.call(this);

    this.strategy = this.getFirstSupported(substrategies);
    this.options = options || {};
  };
  var prototype = FirstSupportedStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  // interface

  prototype.name = "first_supported";

  prototype.isSupported = function() {
    return this.strategy !== null;
  };

  prototype.initialize = function() {
    if (this.strategy) {
      this.strategy.initialize();
    }
  };

  prototype.connect = function() {
    if (!this.strategy || this.abortCallback) {
      return false;
    }

    var self = this;

    var onOpen = function(connection) {
      this.abortCallback = null;
      unbindListeners();
      self.emit("open", connection);
    };
    var onError = function(error) {
      this.abortCallback = null;
      unbindListeners();
      self.emit("error", error);
    };

    var unbindListeners = function() {
      self.strategy.unbind("open", onOpen);
      self.strategy.unbind("error", onError);
    };

    this.abortCallback = function() {
      unbindListeners();
      self.strategy.abort();
    };

    this.strategy.bind("open", onOpen);
    this.strategy.bind("error", onError);

    this.strategy.connect();

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

  prototype.getFirstSupported = function(substrategies) {
    for (var i = 0; i < substrategies.length; i++) {
      if (substrategies[i].isSupported()) {
        return substrategies[i];
      }
    }
    return null;
  }

  Pusher.FirstSupportedStrategy = FirstSupportedStrategy;
}).call(this);
