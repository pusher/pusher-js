;(function() {
  /** Launches all substrategies at the same time and uses the first connected.
   *
   * After establishing the connection, aborts all substrategies so that no
   * other attempts are made later.
   *
   * @param {Array} strategies
   */
  function FirstConnectedStrategy(strategies) {
    Pusher.MultiStrategy.call(this, strategies);
  }
  var prototype = FirstConnectedStrategy.prototype;

  Pusher.Util.extend(prototype, Pusher.MultiStrategy.prototype);

  prototype.name = "first_connected";

  /** @see TransportStrategy.prototype.connect */
  prototype.connect = function(callback) {
    if (!this.isSupported()) {
      return null;
    }
    return Pusher.ParallelStrategy.connect(
      this.strategies,
      function(i, runners) {
        return function(error, connection) {
          runners[i].error = error;
          if (error) {
            if (Pusher.ParallelStrategy.allRunnersFailed(runners)) {
              callback(true);
            }
            return;
          }
          Pusher.ParallelStrategy.abortRunners(runners);
          callback(null, connection);
        };
      }
    );
  };

  Pusher.FirstConnectedStrategy = FirstConnectedStrategy;
}).call(this);
