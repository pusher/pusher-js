import PrivateChannel from './private_channel';
import Logger from '../logger';
import Members from './members';
import Factory from '../utils/factory';

export default class PresenceChannel extends PrivateChannel {
  members: Members;

  /** Adds presence channel functionality to private channels.
   *
   * @param {String} name
   * @param {Pusher} pusher
   */
  constructor(factory: Factory, name : string, pusher : any) {
    super(factory, name, pusher);
    this.members = new Members();
  }

  /** Authenticates the connection as a member of the channel.
   *
   * @param  {String} socketId
   * @param  {Function} callback
   */
  authorize(socketId : string, callback : Function) {
    var self = this;
    super.authorize(socketId, function(error, authData) {
      if (!error) {
        if (authData.channel_data === undefined) {
          Logger.warn(
            "Invalid auth response for channel '" +
            self.name +
            "', expected 'channel_data' field"
          );
          callback("Invalid auth response");
          return;
        }
        var channelData = JSON.parse(authData.channel_data);
        self.members.setMyID(channelData.user_id);
      }
      callback(error, authData);
    });
  }

  /** Handles presence and subscription events. For internal use only.
   *
   * @param {String} event
   * @param {*} data
   */
  handleEvent(event : string, data : any) {
    switch (event) {
      case "pusher_internal:subscription_succeeded":
        this.members.onSubscription(data);
        this.subscribed = true;
        this.emit("pusher:subscription_succeeded", this.members);
        break;
      case "pusher_internal:member_added":
        var addedMember = this.members.addMember(data);
        this.emit('pusher:member_added', addedMember);
        break;
      case "pusher_internal:member_removed":
        var removedMember = this.members.removeMember(data);
        if (removedMember) {
          this.emit('pusher:member_removed', removedMember);
        }
        break;
      default:
        PrivateChannel.prototype.handleEvent.call(this, event, data);
    }
  }

  /** Resets the channel state, including members map. For internal use only. */
  disconnect() {
    this.members.reset();
    super.disconnect();
  }
}
