import Logger from './logger';
import Pusher from './pusher';
import EventsDispatcher from './events/dispatcher';

export default class UserPresenceFacade extends EventsDispatcher {
  private pusher: Pusher;
  private syntaxSugars: Map<string, Array<string>>;

  public constructor(pusher: Pusher) {
    super(function(eventName, data) {
      Logger.debug(`No callbacks on user presence for ${eventName}`);
    });

    this.pusher = pusher;

    this.initializeSyntaxSugars();
    this.bindUserPresenceInternalEvent();
  }

  bind(
    eventName: string,
    callback: Function,
    context?: any
  ): this {
    const syntaxSugarEvents = this.syntaxSugars.get(eventName);
    const userPresenceEvents = syntaxSugarEvents || [eventName];

    userPresenceEvents.forEach(eventName =>
      super.bind(eventName, callback, context)
    );

    return this;
  }

  handleEvent(pusherEvent) {
    pusherEvent.data.events.forEach(userPresenceEvent => {
      this.emit(userPresenceEvent.action, userPresenceEvent);
    });
  }

  private initializeSyntaxSugars() {
    this.syntaxSugars = new Map();
    this.syntaxSugars.set('online-status', ['online', 'offline']);
    this.syntaxSugars.set('channel-subscription', [
      'subscribe',
      'unsubscribe'
    ]);
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
