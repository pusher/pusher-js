;(function() {
  /** Launches all substrategies and emits prioritized connected transports.
   *
   * Substrategies passed as the only argument should be ordered starting from
   * the most preferred one and ending with the least prioritized. After
   * substrategy X connects, substrategies Y > X are aborted, since they are
   * considered worse. Substrategies Y <= X are not aborted and can still emit
   * new connections.
   *
   * @param {Array} strategies
   */
  function BestConnectedEverStrategy(strategies) {
    Pusher.MultiStrategy.call(this, strategies);
  }
  var prototype = BestConnectedEverStrategy.prototype;
  Pusher.Util.extend(prototype, Pusher.MultiStrategy.prototype);

  prototype.connect = function(callback) {
    // TODO implement priorities correctly
    if (!this.isSupported()) {
      return null;
    }
    return Pusher.ParallelStrategy.connect(
      Pusher.MultiStrategy.filterUnsupported(this.strategies),
      function(i, runners) {
        return function(error, connection) {
          runners[i].error = error;
          if (error) {
            if (Pusher.ParallelStrategy.allRunnersFailed(runners)) {
              callback(true);
            }
            return;
          }
          for (var j = i + 1; j < runners.length; j++) {
            Pusher.ParallelStrategy.abortRunner(runners[j]);
          }
          callback(null, connection);
        };
      }
    );
  };

  Pusher.BestConnectedEverStrategy = BestConnectedEverStrategy;
}).call(this);
