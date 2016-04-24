import AssistantToTheTransportManager from './assistant_to_the_transport_manager';
import Transport from "./Transport";
export default class TransportManager {
    options: any;
    livesLeft: number;
    constructor(options: any);
    getAssistant(transport: Transport): AssistantToTheTransportManager;
    isAlive(): boolean;
    reportDeath(): void;
}
