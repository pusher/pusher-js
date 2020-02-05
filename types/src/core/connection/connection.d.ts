import { default as EventsDispatcher } from '../events/dispatcher';
import TransportConnection from '../transports/transport_connection';
import Socket from '../socket';
export default class Connection extends EventsDispatcher implements Socket {
    id: string;
    transport: TransportConnection;
    activityTimeout: number;
    constructor(id: string, transport: TransportConnection);
    handlesActivityChecks(): boolean;
    send(data: any): boolean;
    send_event(name: string, data: any, channel?: string): boolean;
    ping(): void;
    close(): void;
    private bindListeners;
    private handleCloseEvent;
}
