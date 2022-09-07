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
    this.bindUserPresenceEvents();
  }

  bind(
    events: string | Array<string>,
    callback: Function,
    context?: any
  ): this {
    let userPresenceEvents = [];

    if (typeof events === 'string') {
      const syntaxSugarEvents = this.syntaxSugars.get(events);
      if (syntaxSugarEvents !== undefined) {
        userPresenceEvents = syntaxSugarEvents;
      } else {
        Logger.debug(`Unknown events = ${events}`);
      }
    } else {
      userPresenceEvents = events;
    }

    userPresenceEvents.forEach(eventName =>
      super.bind(eventName, callback, context)
    );
    return this;
  }

  private initializeSyntaxSugars() {
    this.syntaxSugars = new Map();
    this.syntaxSugars.set('online-status', ['online', 'offline']);
    this.syntaxSugars.set('channel-subscription', [
      'subscribed',
      'unsubscribed'
    ]);
  }

  private bindUserPresenceEvents() {
    this.pusher.connection.bind('message', event => {
      var eventName = event.event;
      if (eventName === 'pusher_internal:user_presence') {
        this.handleEvent(event);
      }
    });
  }

  private handleEvent(event) {
    event.data.events.forEach(userPresenceEvent => {
      userPresenceEvent.users
        .map(userId => this.buildUserPresenceEvent(userId, userPresenceEvent))
        .forEach(finalEvent => this.emit(userPresenceEvent.action, finalEvent));
    });
  }

  private buildUserPresenceEvent(userId: string, event: any): object {
    return {
      action: event.action,
      user_id: userId,
      channel_name: event.channel_name
    };
  }
}
