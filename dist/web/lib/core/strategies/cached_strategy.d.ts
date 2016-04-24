import Strategy from './strategy';
import StrategyOptions from "./strategy_options";
import TransportStrategy from './transport_strategy';
import Timeline from '../timeline/timeline';
export default class CachedStrategy implements Strategy {
    strategy: Strategy;
    transports: TransportStrategy[];
    ttl: number;
    encrypted: boolean;
    timeline: Timeline;
    constructor(strategy: Strategy, transports: TransportStrategy[], options: StrategyOptions);
    isSupported(): boolean;
    connect(minPriority: number, callback: Function): {
        abort: () => void;
        forceMinPriority: (p: any) => void;
    };
}
