;(function() {
  /** Cross-browser compatible timer abstraction.
   *
   * @param {Number} delay
   * @param {Function} callback
   */
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

  /** Returns whether the timer is still running.
   *
   * @return {Boolean}
   */
  prototype.isRunning = function() {
    return this.timeout !== null;
  };

  /** Aborts a timer when it's running. */
  prototype.ensureAborted = function() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  };

  Pusher.Timer = Timer;
}).call(this);
