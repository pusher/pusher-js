;(function() {
  Pusher.ParallelStrategy = {
    connect: function(strategies, callbackBuilder) {
      var runners = Pusher.Util.map(strategies, function(strategy, i, _, rs) {
        return strategy.connect(callbackBuilder(i, rs))
      });
      return {
        abort: function() {
          Pusher.ParallelStrategy.abortRunners(runners);
        }
      };
    },

    allRunnersFailed: function(runners) {
      return Pusher.Util.all(runners, function(runner) {
        return !!runner.error;
      });
    },

    abortRunner: function(runner) {
      if (!runner.error && !runner.aborted) {
        runner.abort();
        runner.aborted = true;
      }
    },

    abortRunners: function(runners) {
      Pusher.Util.apply(runners, Pusher.ParallelStrategy.abortRunner);
    }
  };
}).call(this);
