import { default as EventsDispatcher } from 'core/events/dispatcher';
import Reachability from 'core/reachability';
export declare class NetInfo extends EventsDispatcher implements Reachability {
    isOnline(): boolean;
}
export declare var Network: NetInfo;
