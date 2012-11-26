;(function() {

  function FirstConnectedEverStrategy(substrategies, options) {
    Pusher.EventsDispatcher.call(this);

    this.substrategies = this.getSupported(substrategies);
    this.options = options || {};
  };
  var prototype = FirstConnectedEverStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  // interface

  prototype.name = "first_connected_ever";

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
        unbindListeners(i);
        if (allFinished()) {
          this.abortCallback = null;
        }
        self.emit("open", connection);
      };
    };
    var getOnErrorListener = function(i) {
      return function(error) {
        unbindListeners(i);
        if (allFinished()) {
          this.abortCallback = null;
          self.emit("error", "all substrategies failed"); // TODO
        }
      };
    };

    var abortSubstrategies = function(ignored) {
      for (var i = 0; i < self.substrategies.length; i++) {
        if (callbacks[i] != undefined) {
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
    var allFinished = function() {
      for (var i = 0; i < self.substrategies.length; i++) {
        if (callbacks[i] != undefined) {
          return false;
        }
      }
      return true;
    };

    this.abortCallback = function() {
      abortSubstrategies();
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

  Pusher.FirstConnectedEverStrategy = FirstConnectedEverStrategy;
}).call(this);
