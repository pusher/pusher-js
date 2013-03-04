;(function() {
  /** Launches the substrategy and terminates on the first open connection.
   *
   * @param {Strategy} strategy
   */
  function FirstConnectedStrategy(strategy) {
    this.strategy = strategy;
  }
  var prototype = FirstConnectedStrategy.prototype;

  prototype.isSupported = function() {
    return this.strategy.isSupported();
  };

  prototype.connect = function(minPriority, callback) {
    var runner = this.strategy.connect(
      minPriority,
      function(error, connection) {
        if (connection) {
          runner.abort();
        }
        callback(error, connection);
      }
    );
    return runner;
  };

  Pusher.FirstConnectedStrategy = FirstConnectedStrategy;
}).call(this);
