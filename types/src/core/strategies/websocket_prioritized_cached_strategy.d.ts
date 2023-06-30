import Strategy from './strategy';
import StrategyOptions from './strategy_options';
import TransportStrategy from './transport_strategy';
import Timeline from '../timeline/timeline';
export interface TransportStrategyDictionary {
    [key: string]: TransportStrategy;
}
export default class WebSocketPrioritizedCachedStrategy implements Strategy {
    strategy: Strategy;
    transports: TransportStrategyDictionary;
    ttl: number;
    usingTLS: boolean;
    timeline: Timeline;
    constructor(strategy: Strategy, transports: TransportStrategyDictionary, options: StrategyOptions);
    isSupported(): boolean;
    connect(minPriority: number, callback: Function): {
        abort: () => void;
        forceMinPriority: (p: any) => void;
    };
}
