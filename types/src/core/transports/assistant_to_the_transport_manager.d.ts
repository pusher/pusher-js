import TransportManager from './transport_manager';
import TransportConnection from './transport_connection';
import Transport from './transport';
import PingDelayOptions from './ping_delay_options';
export default class AssistantToTheTransportManager {
    manager: TransportManager;
    transport: Transport;
    minPingDelay: number;
    maxPingDelay: number;
    pingDelay: number;
    constructor(manager: TransportManager, transport: Transport, options: PingDelayOptions);
    createConnection(name: string, priority: number, key: string, options: Object): TransportConnection;
    isSupported(environment: string): boolean;
}
