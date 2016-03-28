import Strategy from "./strategy";
import StrategyRunner from "./strategy_runner";
/** Launches the substrategy and terminates on the first open connection.
 *
 * @param {Strategy} strategy
 */
export default class FirstConnectedStrategy implements Strategy {
    strategy: Strategy;
    constructor(strategy: Strategy);
    isSupported(): boolean;
    connect(minPriority: number, callback: Function): StrategyRunner;
}
