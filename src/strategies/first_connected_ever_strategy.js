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

  prototype.getOnOpenListener = function(i) {
    var self = this;
    return function(connection) {
      self.succeeded.push(i);

      self.unbindListeners(i);
      if (self.allFinished()) {
        self.abortCallback = null;
      }
      self.emit("open", connection);
    };
  };

  prototype.getOnErrorListener = function(i) {
    var self = this;
    return function(error) {
      self.unbindListeners(i);
      if (self.allFinished() && self.succeeded.length === 0) {
        self.abortCallback = null;
        self.emit("error", "all substrategies failed"); // TODO
      }
    };
  };

  Pusher.FirstConnectedEverStrategy = FirstConnectedEverStrategy;
}).call(this);
