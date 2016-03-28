import Strategy from './strategy';
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
