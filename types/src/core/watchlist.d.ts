import Pusher from './pusher';
import EventsDispatcher from './events/dispatcher';
export default class WatchlistFacade extends EventsDispatcher {
    private pusher;
    constructor(pusher: Pusher);
    handleEvent(pusherEvent: any): void;
    private bindWatchlistInternalEvent;
}
