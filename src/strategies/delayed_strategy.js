;(function() {

  function DelayedStrategy(substrategy, options) {
    this.substrategy = substrategy;
    this.delay = options.delay;
  }
  var prototype = DelayedStrategy.prototype;

  // interface

  prototype.name = "delayed";

  prototype.isSupported = function() {
    return this.substrategy.isSupported();
  };

  prototype.getEncrypted = function() {
    return new DelayedStrategy(
      this.substrategy.getEncrypted(),
      { delay: this.delay }
    );
  };

  prototype.connect = function(callback) {
    if (!this.isSupported()) {
      return null;
    }

    var self = this;
    var abort = function() {
      clearTimeout(timer);
      timer = null;
    };
    var timer = setTimeout(function() {
      if (timer === null) {
        // hack for misbehaving clearTimeout in IE < 9
        return;
      }
      timer = null;
      abort = self.substrategy.connect(callback).abort;
    }, this.delay);

    return {
      abort: function() {
        abort();
      }
    };
  };

  Pusher.DelayedStrategy = DelayedStrategy;
}).call(this);
