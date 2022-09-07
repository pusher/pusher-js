import { type } from 'os';
import Logger from './logger';
import Pusher from './pusher';

export default class UserPresenceFacade {
  _pusher: Pusher
  _eventHandlers: Map<string, Function>
  _syntaxSugar: Map<string, Array<string>> = new Map<string, Array<string>>([
    ['online-status', ['online', 'offline']],
    ['channel-subscription', ['subscribed', 'unsubscribed']]
  ]);

  public constructor(pusher: Pusher) {
    this._pusher = pusher;
    this._eventHandlers = new Map<string, Function>();
    this.bindUserPresenceEvents();
  }

  bind(events: string | Array<string>, callback: Function): this {
    let userPresenceEvents = [];
    
    if (typeof(events) === 'string') {
      const syntaxSugarEvents: Array<string> = this._syntaxSugar[events]
      if (syntaxSugarEvents) {
        userPresenceEvents = syntaxSugarEvents;
      } else {
        Logger.debug(`Ignoring event: ${events}`);
      }
    } else {
      userPresenceEvents = events;
    }

    userPresenceEvents.forEach(eventName => this._eventHandlers[eventName] = callback)
    return this;
  }

  clear(): void {
    this._eventHandlers.clear();
  }

  private bindUserPresenceEvents() {
    this._pusher.connection.bind('message', event => {
      var eventName = event.event;
      if (eventName === 'pusher_internal:user_presence') {
        this.handleUserPresenceEvent(event);
      }
    });
  }

  private handleUserPresenceEvent(event) {
    event.data.events.forEach(userPresenceEvent => {
      const eventHandler: Function = this._eventHandlers[userPresenceEvent.action];
      if (eventHandler) {
        userPresenceEvent.users
          .map(userId => this.buildUserPresenceEvent(userId, userPresenceEvent))
          .forEach(finalEvent => eventHandler.call(global, finalEvent));
      }
    });
  }

  private buildUserPresenceEvent(userId: string, event: any): object {
    return { action: event.action, user_id: userId, channel_name: event.channel_name }
  }
}
