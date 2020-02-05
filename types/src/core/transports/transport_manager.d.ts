import AssistantToTheTransportManager from './assistant_to_the_transport_manager';
import Transport from './transport';
import PingDelayOptions from './ping_delay_options';
export interface TransportManagerOptions extends PingDelayOptions {
    lives?: number;
}
export default class TransportManager {
    options: TransportManagerOptions;
    livesLeft: number;
    constructor(options: TransportManagerOptions);
    getAssistant(transport: Transport): AssistantToTheTransportManager;
    isAlive(): boolean;
    reportDeath(): void;
}
