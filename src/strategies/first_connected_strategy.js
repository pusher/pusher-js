;(function() {

  function FirstConnectedStrategy(substrategies, options) {
    Pusher.AbstractStrategy.call(this, options);
    this.substrategies = this.getSupported(substrategies);
  };
  var prototype = FirstConnectedStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.AbstractStrategy.prototype);

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

    this.listeners = {};

    this.abortCallback = function() {
      self.abortSubstrategies();
      self.unbindAllListeners();
    };

    for (var i = 0; i < self.substrategies.length; i++) {
      this.listeners[i] = {
        onOpen: this.getOnOpenListener(i),
        onError: this.getOnErrorListener(i),
      };

      this.substrategies[i].bind("open", this.listeners[i].onOpen);
      this.substrategies[i].bind("error", this.listeners[i].onError);

      this.substrategies[i].connect();
    }

    return true;
  };

  // protected

  prototype.getOnOpenListener = function(i) {
    var self = this;
    return function(connection) {
      self.abortCallback = null;
      self.abortSubstrategies(i);
      self.unbindAllListeners();
      self.emit("open", connection);
    };
  };

  prototype.getOnErrorListener = function(i) {
    var self = this;
    return function(error) {
      self.unbindListeners(i);
      if (self.allFinished()) {
        self.abortCallback = null;
        self.emit("error", "all substrategies failed"); // TODO
      }
    };
  };

  prototype.allFinished = function() {
    for (var i = 0; i < this.substrategies.length; i++) {
      if (this.listeners[i] != undefined) {
        return false;
      }
    }
    return true;
  };

  prototype.unbindListeners = function(i) {
    if (this.listeners[i]) {
      this.substrategies[i].unbind("open", this.listeners[i].onOpen);
      this.substrategies[i].unbind("error", this.listeners[i].onError);
      this.listeners[i] = null;
    }
  };

  prototype.unbindAllListeners = function() {
    for (var i = 0; i < this.substrategies.length; i++) {
      this.unbindListeners(i);
    }
  };

  prototype.abortSubstrategies = function(ignored) {
    for (var i = 0; i < this.substrategies.length; i++) {
      if (i !== ignored && this.listeners[i]) {
        this.substrategies[i].abort();
      }
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
