import Reachability from 'core/reachability';
import { default as EventsDispatcher } from 'core/events/dispatcher';
export declare class NetInfo extends EventsDispatcher implements Reachability {
    constructor();
    isOnline(): boolean;
}
export declare var Network: NetInfo;
