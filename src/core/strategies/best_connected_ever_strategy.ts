import * as Collections from '../utils/collections';
import Util from '../util';
import Strategy from './strategy';

/** Launches all substrategies and emits prioritized connected transports.
 *
 * @param {Array} strategies
 */
export default class BestConnectedEverStrategy implements Strategy {
  strategies: Strategy[];

  constructor(strategies: Strategy[]) {
    this.strategies = strategies;
  }

  isSupported(): boolean {
    return Collections.any(this.strategies, Util.method('isSupported'));
  }

  connect(minPriority: number, callback: Function) {
    return connect(this.strategies, minPriority, function(i, runners) {
      return function(error, handshake) {
        runners[i].error = error;
        if (error) {
          if (allRunnersFailed(runners)) {
            callback(true);
          }
          return;
        }
        Collections.apply(runners, function(runner) {
          runner.forceMinPriority(handshake.transport.priority);
        });
        callback(null, handshake);
      };
    });
  }
}

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
function connect(
  strategies: Strategy[],
  minPriority: number,
  callbackBuilder: Function
) {
  var runners = Collections.map(strategies, function(strategy, i, _, rs) {
    return strategy.connect(minPriority, callbackBuilder(i, rs));
  });
  return {
    abort: function() {
      Collections.apply(runners, abortRunner);
    },
    forceMinPriority: function(p) {
      Collections.apply(runners, function(runner) {
        runner.forceMinPriority(p);
      });
    }
  };
}

function allRunnersFailed(runners): boolean {
  return Collections.all(runners, function(runner) {
    return Boolean(runner.error);
  });
}

function abortRunner(runner) {
  if (!runner.error && !runner.aborted) {
    runner.abort();
    runner.aborted = true;
  }
}
