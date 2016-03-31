import Strategy from './strategy';
export default class BestConnectedEverStrategy implements Strategy {
    strategies: Strategy[];
    constructor(strategies: Strategy[]);
    isSupported(): boolean;
    connect(minPriority: number, callback: Function): {
        abort: () => void;
        forceMinPriority: (p: any) => void;
    };
}
