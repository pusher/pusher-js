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

  prototype.forceSecure = function(value) {
    this.substrategy.forceSecure(value);
  };

  prototype.connect = function(callback) {
    if (!this.isSupported()) {
      return null;
    }

    var self = this;
    var abort = function() {
      clearTimeout(this.timer);
      this.timer = null;
    };
    this.timer = setTimeout(function() {
      if (self.timer === null) {
        // hack for misbehaving clearTimeout in IE < 9
        return;
      }
      self.timer = null;
      abort = self.substrategy.connect(callback).abort;
    }, this.options.delay);

    return {
      abort: abort
    };
  };

  Pusher.DelayedStrategy = DelayedStrategy;
}).call(this);
