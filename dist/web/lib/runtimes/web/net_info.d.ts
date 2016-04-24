import { default as EventsDispatcher } from 'core/events/dispatcher';
export declare class NetInfo extends EventsDispatcher {
    constructor();
    isOnline(): boolean;
}
export declare var Network: NetInfo;
