import Logger from './logger';
import Pusher from './pusher';
import EventsDispatcher from './events/dispatcher';

export default class WatchlistFacade extends EventsDispatcher {
  private pusher: Pusher;

  public constructor(pusher: Pusher) {
    super(function(eventName, data) {
      Logger.debug(`No callbacks on watchlist events for ${eventName}`);
    });

    this.pusher = pusher;
    this.bindWatchlistInternalEvent();
  }

  handleEvent(pusherEvent) {
    pusherEvent.data.events.forEach(watchlistEvent => {
      this.emit(watchlistEvent.name, watchlistEvent);
    });
  }

  private bindWatchlistInternalEvent() {
    this.pusher.connection.bind('message', pusherEvent => {
      var eventName = pusherEvent.event;
      if (eventName === 'pusher_internal:watchlist_events') {
        this.handleEvent(pusherEvent);
      }
    });
  }
}
