import EventsDispatcher from 'core/events/dispatcher';
import Reachability from 'core/reachability';
export declare class NetInfo extends EventsDispatcher implements Reachability {
    online: boolean;
    constructor();
    isOnline(): boolean;
}
export declare var Network: NetInfo;
