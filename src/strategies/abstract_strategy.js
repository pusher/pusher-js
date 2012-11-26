;(function() {

  function AbstractStrategy(options) {
    Pusher.EventsDispatcher.call(this);
    this.options = options || {};
  };
  var prototype = AbstractStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  // interface

  prototype.abort = function() {
    if (this.abortCallback) {
      this.abortCallback();
      this.abortCallback = null;
      return true;
    } else {
      return false;
    }
  };

  Pusher.AbstractStrategy = AbstractStrategy;
}).call(this);
