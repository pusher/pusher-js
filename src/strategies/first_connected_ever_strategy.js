;(function() {

  function FirstConnectedEverStrategy(substrategies) {
    Pusher.FirstConnectedStrategy.call(this, substrategies);
  }
  var prototype = FirstConnectedEverStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.FirstConnectedStrategy.prototype);

  // interface

  prototype.name = "first_connected_ever";

  // protected

  prototype.getCallback = function(i, runners, callback) {
    var self = this;

    return function(error, connection) {
      runners[i].error = error;
      if (error) {
        if (self.allFailed(runners)) {
          callback(true);
        }
        return;
      }
      callback(null, connection);
    };
  };

  Pusher.FirstConnectedEverStrategy = FirstConnectedEverStrategy;
}).call(this);
