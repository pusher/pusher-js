import { default as EventsDispatcher } from '../../events/dispatcher';
export declare class NetInfo extends EventsDispatcher {
    isOnline(): boolean;
}
export declare var Network: NetInfo;
