import TransportManager from '../transports/transport_manager';
import Strategy from './strategy';
export declare var defineTransport: (config: any, name: string, type: string, priority: number, options: any, manager?: TransportManager) => Strategy;
