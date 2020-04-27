import TransportManager from '../transports/transport_manager';
import Strategy from './strategy';
import StrategyOptions from '../strategies/strategy_options';
import { Config } from '../config';
export declare var defineTransport: (config: Config, name: string, type: string, priority: number, options: StrategyOptions, manager?: TransportManager) => Strategy;
