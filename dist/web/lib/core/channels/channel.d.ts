import { default as EventsDispatcher } from '../events/dispatcher';
import Pusher from '../pusher';
export default class Channel extends EventsDispatcher {
    name: string;
    pusher: Pusher;
    subscribed: boolean;
    constructor(name: string, pusher: Pusher);
    authorize(socketId: string, callback: Function): any;
    trigger(event: string, data: any): boolean;
    disconnect(): void;
    handleEvent(event: string, data: any): void;
    subscribe(): void;
    unsubscribe(): void;
}
