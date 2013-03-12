;(function() {
  function Timer(delay, callback) {
    var self = this;

    this.timeout = setTimeout(function() {
      if (self.timeout !== null) {
        callback();
        self.timeout = null;
      }
    }, delay);
  }
  var prototype = Timer.prototype;

  prototype.isRunning = function() {
    return this.timeout !== null;
  };

  prototype.ensureAborted = function() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  };

  Pusher.Timer = Timer;
}).call(this);
