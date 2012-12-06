;(function() {

  function FirstConnectedStrategy(substrategies) {
    Pusher.AbstractMultiStrategy.call(this, substrategies);
  }
  var prototype = FirstConnectedStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.AbstractMultiStrategy.prototype);

  // interface

  prototype.name = "first_connected";

  prototype.connect = function(callback) {
    if (!this.isSupported()) {
      return null;
    }

    var runners = [];
    for (var i = 0; i < this.substrategies.length; i++) {
      runners.push(
        this.substrategies[i].connect(this.getCallback(i, runners, callback))
      );
    }

    var self = this;
    return {
      abort: function() {
        self.abortRunners(runners);
      }
    };
  };

  // protected

  prototype.getCallback = function(i, runners, callback) {
    var self = this;

    return function(error, connection) {
      if (error) {
        runners[i] = null;
        if (self.allFinished(runners)) {
          callback(true);
        }
        return;
      }
      self.abortRunners(runners);
      callback(null, connection);
    };
  };

  prototype.allFinished = function(runners) {
    for (var i = 0; i < runners.length; i++) {
      if (runners[i]) {
        return false;
      }
    }
    return true;
  };

  prototype.abortRunners = function(runners) {
    for (var i = 0; i < runners.length; i++) {
      if (runners[i]) {
        runners[i].abort();
      }
    }
  };

  Pusher.FirstConnectedStrategy = FirstConnectedStrategy;
}).call(this);
