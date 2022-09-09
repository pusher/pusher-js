import Logger from './logger';
import Pusher from './pusher';
import EventsDispatcher from './events/dispatcher';

export default class UserPresenceFacade extends EventsDispatcher {
  private pusher: Pusher;

  public constructor(pusher: Pusher) {
    super(function(eventName, data) {
      Logger.debug(`No callbacks on user presence for ${eventName}`);
    });

    this.pusher = pusher;
    this.bindUserPresenceInternalEvent();
  }

  handleEvent(pusherEvent) {
    pusherEvent.data.events.forEach(userPresenceEvent => {
      this.emit(userPresenceEvent.action, userPresenceEvent);
    });
  }

  private bindUserPresenceInternalEvent() {
    this.pusher.connection.bind('message', pusherEvent => {
      var eventName = pusherEvent.event;
      if (eventName === 'pusher_internal:user_presence') {
        this.handleEvent(pusherEvent);
      }
    });
  }
}
