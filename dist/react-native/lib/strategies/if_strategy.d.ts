import Strategy from "./strategy";
import StrategyRunner from "./strategy_runner";
/** Proxies method calls to one of substrategies basing on the test function.
 *
 * @param {Function} test
 * @param {Strategy} trueBranch strategy used when test returns true
 * @param {Strategy} falseBranch strategy used when test returns false
 */
export default class IfStrategy implements Strategy {
    test: () => boolean;
    trueBranch: Strategy;
    falseBranch: Strategy;
    constructor(test: () => boolean, trueBranch: Strategy, falseBranch: Strategy);
    isSupported(): boolean;
    connect(minPriority: number, callback: Function): StrategyRunner;
}
