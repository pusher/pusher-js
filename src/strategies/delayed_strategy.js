;(function() {

  function DelayedStrategy(substrategy, options) {
    Pusher.AbstractStrategy.call(this, options);
    this.substrategy = substrategy;
  }
  var prototype = DelayedStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.AbstractStrategy.prototype);

  // interface

  prototype.name = "delayed";

  prototype.isSupported = function() {
    return this.substrategy.isSupported();
  };

  prototype.initialize = function() {
    if (this.initializeTimer) {
      return;
    }

    var self = this;

    this.initializeTimer = setTimeout(function() {
      self.initializeTimer = null;
      self.initializeSubstrategy();
    }, this.options.delay);
  };

  prototype.connect = function() {
    if (!this.isSupported() || this.abortCallback) {
      return false;
    }

    var self = this;

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

    this.connectTimer = setTimeout(function() {
      if (self.connectTimer === null) {
        // hack for misbehaving clearTimeout in IE < 9
        return;
      }
      self.connectTimer = null;
      self.connectSubstrategy();
    }, this.options.delay);

    return true;
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
      self.abortCallback = null;
      unbindListeners();
      self.emit("open", connection);
    };
    var onError = function(error) {
      self.abortCallback = null;
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
  };

  Pusher.DelayedStrategy = DelayedStrategy;
}).call(this);
