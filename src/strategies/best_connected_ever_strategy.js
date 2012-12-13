;(function() {
  /** Launches all substrategies and emits prioritized connected transports.
   *
   * Substrategies passed as the only argument should be ordered starting from
   * the most preferred one and ending with the least prioritized. After
   * substrategy X connects, substrategies Y > X are aborted, since they are
   * considered worse. Substrategies Y <= X are not aborted and can still emit
   * new connections.
   *
   * @param {Array} substrategies
   */
  function BestConnectedEverStrategy(substrategies) {
    Pusher.FirstConnectedStrategy.call(this, substrategies);
  }
  var prototype = BestConnectedEverStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.FirstConnectedStrategy.prototype);

  prototype.name = "best_connected_ever";

  /** @protected */
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
      for (var j = i + 1; j < runners.length; j++) {
        self.abortRunner(runners, j);
      }
      callback(null, connection);
    };
  };

  Pusher.BestConnectedEverStrategy = BestConnectedEverStrategy;
}).call(this);
