;(function() {

  function FirstConnectedStrategy(substrategies, options) {
    Pusher.EventsDispatcher.call(this);

    this.substrategies = this.getSupported(substrategies);
    this.options = options || {};
  };
  var prototype = FirstConnectedStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  // interface

  prototype.name = "first_connected";

  prototype.isSupported = function() {
    return this.substrategies.length > 0;
  };

  prototype.initialize = function() {
    for (var i = 0; i < this.substrategies.length; i++) {
      this.substrategies[i].initialize();
    }
  };

  prototype.connect = function() {
    if (!this.isSupported() || this.abortCallback) {
      return false;
    }

    var self = this;
    var callbacks = {};

    var getOnOpenListener = function(i) {
      return function(connection) {
        this.abortCallback = null;
        abortSubstrategiesExceptFor(i);
        unbindAllListeners();
        self.emit("open", connection);
      };
    };
    var getOnErrorListener = function(i) {
      return function(error) {
        unbindListeners(i);
        if (allFailed()) {
          this.abortCallback = null;
          self.emit("error", "all substrategies failed"); // TODO
        }
      };
    };

    var abortSubstrategiesExceptFor = function(ignored) {
      for (var i = 0; i < self.substrategies.length; i++) {
        if (i !== ignored && callbacks[i] != undefined) {
          self.substrategies[i].abort();
        }
      }
    };
    var unbindListeners = function(i) {
      if (callbacks[i] != undefined) {
        self.substrategies[i].unbind("open", callbacks[i].onOpen);
        self.substrategies[i].unbind("error", callbacks[i].onError);
        callbacks[i] = null;
      }
    };
    var unbindAllListeners = function() {
      for (var i = 0; i < self.substrategies.length; i++) {
        unbindListeners(i);
      }
    };
    var allFailed = function() {
      for (var i = 0; i < self.substrategies.length; i++) {
        if (callbacks[i] != undefined) {
          return false;
        }
      }
      return true;
    };

    this.abortCallback = function() {
      abortSubstrategiesExceptFor();
      unbindAllListeners();
    };

    for (var i = 0; i < self.substrategies.length; i++) {
      callbacks[i] = {
        onOpen: getOnOpenListener(i),
        onError: getOnErrorListener(i),
      };

      this.substrategies[i].bind("open", callbacks[i].onOpen);
      this.substrategies[i].bind("error", callbacks[i].onError);

      this.substrategies[i].connect();
    }

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
  };

  Pusher.FirstConnectedStrategy = FirstConnectedStrategy;
}).call(this);
