import { default as EventsDispatcher } from '../events/dispatcher';
import Client from '../client';
export default class Channel extends EventsDispatcher {
    name: string;
    pusher: Client;
    subscribed: boolean;
    constructor(name: string, pusher: Client);
    authorize(socketId: string, callback: Function): any;
    trigger(event: string, data: any): void;
    disconnect(): void;
    handleEvent(event: string, data: any): void;
    subscribe(): void;
    unsubscribe(): void;
}
