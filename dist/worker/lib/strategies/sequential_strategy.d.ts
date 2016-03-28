import Strategy from "./strategy";
import StrategyOptions from "./strategy_options";
/** Loops through strategies with optional timeouts.
 *
 * Options:
 * - loop - whether it should loop through the substrategy list
 * - timeout - initial timeout for a single substrategy
 * - timeoutLimit - maximum timeout
 *
 * @param {Strategy[]} strategies
 * @param {Object} options
 */
export default class SequentialStrategy implements Strategy {
    strategies: Strategy[];
    loop: boolean;
    failFast: boolean;
    timeout: number;
    timeoutLimit: number;
    constructor(strategies: Strategy[], options: StrategyOptions);
    isSupported(): boolean;
    connect(minPriority: number, callback: Function): {
        abort: () => void;
        forceMinPriority: (p: any) => void;
    };
    /** @private */
    tryStrategy(strategy: Strategy, minPriority: number, options: StrategyOptions, callback: Function): {
        abort: () => void;
        forceMinPriority: (p: any) => void;
    };
}
