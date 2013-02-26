;(function() {
  /** Launches the substrategy and terminates on first open connection.
   *
   * @param {Strategy[]} strategies
   */
  function FirstConnectedStrategy(strategy) {
    this.strategy = strategy;
    this.options = {};
  }
  var prototype = FirstConnectedStrategy.prototype;

  prototype.name = "first_connected";

  prototype.isSupported = function() {
    return this.strategy.isSupported();
  };

  prototype.connect = function(callback) {
    var runner = this.strategy.connect(function(error, connection) {
      if (connection) {
        runner.abort();
      }
      callback(error, connection);
    });
    return runner;
  };

  Pusher.FirstConnectedStrategy = FirstConnectedStrategy;
}).call(this);
