;(function() {

  function DelayedStrategy(substrategy, options) {
    Pusher.EventsDispatcher.call(this);

    this.substrategy = substrategy;
    this.options = options || {};
  };
  var prototype = DelayedStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  // interface

  prototype.name = "delayed";

  prototype.isSupported = function() {
    return this.substrategy.isSupported();
  };

  prototype.initialize = function() {
    var self = this;

    this.initializeTimer = setTimeout(function() {
      self.initializeSubstrategy();
    }, this.options.delay);
  };

  prototype.connect = function() {
    if (!this.isSupported() || this.abortCallback) {
      return false;
    }

    var self = this;

    this.connectTimer = setTimeout(function() {
      self.connectSubstrategy();
    }, this.options.delay);
    this.abortCallback = function() {
      if (this.initializeTimer) {
        clearTimeout(this.initializeTimer);
        this.initializeTimer = null;
      }
      if (this.connectTimer) {
        clearTimeout(this.connectTimer);
        this.connectTimer = null;
      }
    };

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

  prototype.initializeSubstrategy = function() {
    this.initializeTimer = null;
    this.substrategy.initialize();
  };

  prototype.connectSubstrategy = function() {
    var self = this;

    if (this.initializeTimer) {
      clearTimeout(this.initializeTimer);
      this.initializeTimer = null;
      this.initializeSubstrategy();
    }

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
      self.substrategy.unbind("open", onOpen);
      self.substrategy.unbind("error", onError);
    };

    this.abortCallback = function() {
      unbindListeners();
      self.substrategy.abort();
    };

    this.substrategy.bind("open", onOpen);
    this.substrategy.bind("error", onError);

    this.substrategy.connect();
  }

  Pusher.DelayedStrategy = DelayedStrategy;
}).call(this);
