;(function() {
  Pusher.ParallelStrategy = {
    /** Connects to all strategies in parallel.
     *
     * Callback builder should be a function that takes two arguments: index
     * and a list of runners. It should return another function that will be
     * passed to the substrategy with given index. Runners can be aborted using
     * abortRunner(s) functions from this class.
     *
     * @param  {Array} strategies
     * @param  {Function} callbackBuilder
     * @return {Object} strategy runner
     */
    connect: function(strategies, callbackBuilder) {
      var runners = Pusher.Util.map(strategies, function(strategy, i, _, rs) {
        return strategy.connect(callbackBuilder(i, rs));
      });
      return {
        abort: function() {
          Pusher.ParallelStrategy.abortRunners(runners);
        }
      };
    },

    /** Checks whether all runners have failed.
     *
     * @param  {Array} runners
     * @return {Boolean}
     */
    allRunnersFailed: function(runners) {
      return Pusher.Util.all(runners, function(runner) {
        return !!runner.error;
      });
    },

    /** Aborts a single working runner.
     *
     * @param  {Object} runner
     */
    abortRunner: function(runner) {
      if (!runner.error && !runner.aborted) {
        runner.abort();
        runner.aborted = true;
      }
    },

    /** Aborts all working runners.
     *
     * @param  {Array} runners
     */
    abortRunners: function(runners) {
      Pusher.Util.apply(runners, Pusher.ParallelStrategy.abortRunner);
    }
  };
}).call(this);
