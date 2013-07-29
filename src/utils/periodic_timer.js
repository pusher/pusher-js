;(function() {
  /** Cross-browser compatible periodic timer abstraction.
   *
   * @param {Number} interval
   * @param {Function} callback
   */
  function PeriodicTimer(interval, callback) {
    var self = this;

    this.interval = setInterval(function() {
      if (self.interval !== null) {
        callback();
      }
    }, interval);
  }
  var prototype = PeriodicTimer.prototype;

  /** Returns whether the timer is still running.
   *
   * @return {Boolean}
   */
  prototype.isRunning = function() {
    return this.interval !== null;
  };

  /** Aborts a timer when it's running. */
  prototype.ensureAborted = function() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  };

  Pusher.PeriodicTimer = PeriodicTimer;
}).call(this);
