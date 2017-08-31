import {default as EventsDispatcher} from '../events/dispatcher';
import * as Errors from '../errors';
import Logger from '../logger';
import Pusher from '../pusher';

/** Provides base public channel interface with an event emitter.
 *
 * Emits:
 * - pusher:subscription_succeeded - after subscribing successfully
 * - other non-internal events
 *
 * @param {String} name
 * @param {Pusher} pusher
 */
export default class Channel extends EventsDispatcher {
  name: string;
  pusher: Pusher;
  subscribed: boolean;
  subscriptionPending: boolean;
  subscriptionCancelled: boolean;

  constructor(name : string, pusher: Pusher) {
    super(function(event, data){
      Logger.debug('No callbacks on ' + name + ' for ' + event);
    });

    this.name = name;
    this.pusher = pusher;
    this.subscribed = false;
    this.subscriptionPending = false;
    this.subscriptionCancelled = false;
  }

  /** Skips authorization, since public channels don't require it.
   *
   * @param {Function} callback
   */
  authorize(socketId : string, callback : Function) {
    return callback(false, {});
  }

  /** Triggers an event */
  trigger(event : string, data : any) {
    if (event.indexOf("client-") !== 0) {
      throw new Errors.BadEventName(
        "Event '" + event + "' does not start with 'client-'"
      );
    }
    return this.pusher.send_event(event, data, this.name);
  }

  /** Signals disconnection to the channel. For internal use only. */
  disconnect() {
    this.subscribed = false;
    this.subscriptionPending = false;
  }

  /** Handles an event. For internal use only.
   *
   * @param {String} event
   * @param {*} data
   */
  handleEvent(event : string, data : any) {
    if (event.indexOf("pusher_internal:") === 0) {
      if (event === "pusher_internal:subscription_succeeded") {
        this.subscriptionPending = false;
        this.subscribed = true;
        if (this.subscriptionCancelled) {
          this.pusher.unsubscribe(this.name);
        } else {
          this.emit("pusher:subscription_succeeded", data);
        }
      }
    } else {
      this.emit(event, data);
    }
  }

  /** Sends a subscription request. For internal use only. */
  subscribe() {
    if (this.subscribed) { return; }
    this.subscriptionPending = true;
    this.subscriptionCancelled = false;
    this.authorize(this.pusher.connection.socket_id, (error, data)=> {
      if (error) {
        this.handleEvent('pusher:subscription_error', data);
      } else {
        this.pusher.send_event('pusher:subscribe', {
          auth: data.auth,
          channel_data: data.channel_data,
          channel: this.name
        });
      }
    });
  }

  /** Sends an unsubscription request. For internal use only. */
  unsubscribe() {
    this.subscribed = false;
    this.pusher.send_event('pusher:unsubscribe', {
      channel: this.name
    });
  }

  /** Cancels an in progress subscription. For internal use only. */
  cancelSubscription() {
    this.subscriptionCancelled = true;
  }

  /** Reinstates an in progress subscripiton. For internal use only. */
  reinstateSubscription() {
    this.subscriptionCancelled = false;
  }
}
