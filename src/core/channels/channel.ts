import { default as EventsDispatcher } from '../events/dispatcher';
import * as Errors from '../errors';
import Logger from '../logger';
import Pusher from '../pusher';
import { PusherEvent } from '../connection/protocol/message-types';
import Metadata from './metadata';
import UrlStore from '../utils/url_store';
import { AuthData, AuthorizerCallback } from '../auth/options';
import { HTTPAuthError } from '../errors';

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

  constructor(name: string, pusher: Pusher) {
    super(function(event, data) {
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
  authorize(socketId: string, callback: AuthorizerCallback) {
    return callback(null, { auth: '' });
  }

  /** Triggers an event */
  trigger(event: string, data: any) {
    if (event.indexOf('client-') !== 0) {
      throw new Errors.BadEventName(
        "Event '" + event + "' does not start with 'client-'"
      );
    }
    if (!this.subscribed) {
      var suffix = UrlStore.buildLogSuffix('triggeringClientEvents');
      Logger.warn(
        `Client event triggered before channel 'subscription_succeeded' event . ${suffix}`
      );
    }
    return this.pusher.send_event(event, data, this.name);
  }

  /** Signals disconnection to the channel. For internal use only. */
  disconnect() {
    this.subscribed = false;
    this.subscriptionPending = false;
  }

  /** Handles a PusherEvent. For internal use only.
   *
   * @param {PusherEvent} event
   */
  handleEvent(event: PusherEvent) {
    var eventName = event.event;
    var data = event.data;
    if (eventName === 'pusher_internal:subscription_succeeded') {
      this.handleSubscriptionSucceededEvent(event);
    } else if (eventName.indexOf('pusher_internal:') !== 0) {
      var metadata: Metadata = {};
      this.emit(eventName, data, metadata);
    }
  }

  handleSubscriptionSucceededEvent(event: PusherEvent) {
    this.subscriptionPending = false;
    this.subscribed = true;
    if (this.subscriptionCancelled) {
      this.pusher.unsubscribe(this.name);
    } else {
      this.emit('pusher:subscription_succeeded', event.data);
    }
  }

  /** Sends a subscription request. For internal use only. */
  subscribe() {
    if (this.subscribed) {
      return;
    }
    this.subscriptionPending = true;
    this.subscriptionCancelled = false;
    this.authorize(
      this.pusher.connection.socket_id,
      (error: Error | null, data: AuthData) => {
        if (error) {
          this.subscriptionPending = false;
          // Why not bind to 'pusher:subscription_error' a level up, and log there?
          // Binding to this event would cause the warning about no callbacks being
          // bound (see constructor) to be suppressed, that's not what we want.
          Logger.error(error.toString());
          this.emit(
            'pusher:subscription_error',
            Object.assign(
              {},
              {
                type: 'AuthError',
                error: error.message
              },
              error instanceof HTTPAuthError ? { status: error.status } : {}
            )
          );
        } else {
          this.pusher.send_event('pusher:subscribe', {
            auth: data.auth,
            channel_data: data.channel_data,
            channel: this.name
          });
        }
      }
    );
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
