import Strategy from './strategy';
import StrategyRunner from './strategy_runner';
export default class FirstConnectedStrategy implements Strategy {
    strategy: Strategy;
    constructor(strategy: Strategy);
    isSupported(): boolean;
    connect(minPriority: number, callback: Function): StrategyRunner;
}
