import Strategy from './strategy';
import StrategyRunner from './strategy_runner';
export default class IfStrategy implements Strategy {
    test: () => boolean;
    trueBranch: Strategy;
    falseBranch: Strategy;
    constructor(test: () => boolean, trueBranch: Strategy, falseBranch: Strategy);
    isSupported(): boolean;
    connect(minPriority: number, callback: Function): StrategyRunner;
}
