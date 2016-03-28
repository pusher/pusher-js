import Strategy from './strategy';
/** Runs substrategy after specified delay.
 *
 * Options:
 * - delay - time in miliseconds to delay the substrategy attempt
 *
 * @param {Strategy} strategy
 * @param {Object} options
 */
export default class DelayedStrategy implements Strategy {
    strategy: Strategy;
    options: any;
    constructor(strategy: Strategy, {delay: number}: {
        delay: any;
    });
    isSupported(): boolean;
    connect(minPriority: number, callback: Function): {
        abort: () => void;
        forceMinPriority: (p: any) => void;
    };
}
