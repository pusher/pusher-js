import Strategy from "./strategy";
import StrategyRunner from "./strategy_runner";

/** Launches the substrategy and terminates on the first open connection.
 *
 * @param {Strategy} strategy
 */
export default class FirstConnectedStrategy implements Strategy {
  strategy : Strategy;

  constructor(strategy : Strategy) {
    this.strategy = strategy;
  }

  isSupported() : boolean {
    return this.strategy.isSupported();
  }

  connect(minPriority : number, callback : Function) : StrategyRunner {
    var runner = this.strategy.connect(
      minPriority,
      function(error, handshake) {
        if (handshake) {
          runner.abort();
        }
        callback(error, handshake);
      }
    );
    return runner;
  }

}
