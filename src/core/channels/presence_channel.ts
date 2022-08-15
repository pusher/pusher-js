import PrivateChannel from './private_channel';
import Logger from '../logger';
import Members from './members';
import Pusher from '../pusher';
import UrlStore from 'core/utils/url_store';
import { PusherEvent } from '../connection/protocol/message-types';
import Metadata from './metadata';
import { ChannelAuthorizationData } from '../auth/options';

export default class PresenceChannel extends PrivateChannel {
  members: Members;

  /** Adds presence channel functionality to private channels.
   *
   * @param {String} name
   * @param {Pusher} pusher
   */
  constructor(name: string, pusher: Pusher) {
    super(name, pusher);
    this.members = new Members();
  }

  /** Authorizes the connection as a member of the channel.
   *
   * @param  {String} socketId
   * @param  {Function} callback
   */
  authorize(socketId: string, callback: Function) {
    super.authorize(socketId, async (error, authData) => {
      if (!error) {
        authData = authData as ChannelAuthorizationData;
        if (authData.channel_data != null) {
          var channelData = JSON.parse(authData.channel_data);
          this.members.setMyID(channelData.user_id);
        } else {
          await this.pusher.user.signinDonePromise;
          if (this.pusher.user.user_data != null) {
            // If the user is signed in, get the id of the authenticated user
            // and allow the presence authorization to continue.
            this.members.setMyID(this.pusher.user.user_data.id);
          } else {
            let suffix = UrlStore.buildLogSuffix('authorizationEndpoint');
            Logger.error(
              `Invalid auth response for channel '${this.name}', ` +
                `expected 'channel_data' field. ${suffix}, ` +
                `or the user should be signed in.`
            );
            callback('Invalid auth response');
            return;
          }
        }
      }
      callback(error, authData);
    });
  }

  /** Handles presence and subscription events. For internal use only.
   *
   * @param {PusherEvent} event
   */
  handleEvent(event: PusherEvent) {
    var eventName = event.event;
    if (eventName.indexOf('pusher_internal:') === 0) {
      this.handleInternalEvent(event);
    } else {
      var data = event.data;
      var metadata: Metadata = {};
      if (event.user_id) {
        metadata.user_id = event.user_id;
      }
      this.emit(eventName, data, metadata);
    }
  }
  handleInternalEvent(event: PusherEvent) {
    var eventName = event.event;
    var data = event.data;
    switch (eventName) {
      case 'pusher_internal:subscription_succeeded':
        this.handleSubscriptionSucceededEvent(event);
        break;
      case 'pusher_internal:subscription_count':
        this.handleSubscriptionCountEvent(event);
        break;
      case 'pusher_internal:member_added':
        var addedMember = this.members.addMember(data);
        this.emit('pusher:member_added', addedMember);
        break;
      case 'pusher_internal:member_removed':
        var removedMember = this.members.removeMember(data);
        if (removedMember) {
          this.emit('pusher:member_removed', removedMember);
        }
        break;
    }
  }

  handleSubscriptionSucceededEvent(event: PusherEvent) {
    this.subscriptionPending = false;
    this.subscribed = true;
    if (this.subscriptionCancelled) {
      this.pusher.unsubscribe(this.name);
    } else {
      this.members.onSubscription(event.data);
      this.emit('pusher:subscription_succeeded', this.members);
    }
  }

  /** Resets the channel state, including members map. For internal use only. */
  disconnect() {
    this.members.reset();
    super.disconnect();
  }
}
