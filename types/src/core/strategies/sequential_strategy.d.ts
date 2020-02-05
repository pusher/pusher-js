import Strategy from './strategy';
import StrategyOptions from './strategy_options';
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
    private tryStrategy;
}
