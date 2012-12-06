;(function() {

  function FirstConnectedEverStrategy(substrategies) {
    Pusher.FirstConnectedStrategy.call(this, substrategies);
    this.succeeded = [];
  }
  var prototype = FirstConnectedEverStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.FirstConnectedStrategy.prototype);

  // interface

  prototype.name = "first_connected_ever";

  // protected

  prototype.getCallback = function(i, runners, callback) {
    var self = this;

    return function(error, connection) {
      if (error) {
        runners[i] = null;
        if (self.allFinished(runners) && self.succeeded.length === 0) {
          callback(true);
        }
        return;
      }
      self.succeeded.push(i);
      callback(null, connection);
    };
  };

  Pusher.FirstConnectedEverStrategy = FirstConnectedEverStrategy;
}).call(this);
