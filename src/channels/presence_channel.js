var Util = require('../util');
var PrivateChannel = require('./private_channel');
var Members = require('./members');

/** Adds presence channel functionality to private channels.
 *
 * @param {String} name
 * @param {Pusher} pusher
 */
function PresenceChannel(name, pusher) {
  PrivateChannel.call(this, name, pusher);
  this.members = new Members();
}
var prototype = PresenceChannel.prototype;
Util.extend(prototype, PrivateChannel.prototype);

/** Authenticates the connection as a member of the channel.
 *
 * @param  {String} socketId
 * @param  {Function} callback
 */
prototype.authorize = function(socketId, callback) {
  var _super = PrivateChannel.prototype.authorize;
  var self = this;
  _super.call(self, socketId, function(error, authData) {
    if (!error) {
      if (authData.channel_data === undefined) {
        Pusher.warn(
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
};

/** Handles presence and subscription events. For internal use only.
 *
 * @param {String} event
 * @param {*} data
 */
prototype.handleEvent = function(event, data) {
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
};

/** Resets the channel state, including members map. For internal use only. */
prototype.disconnect = function() {
  this.members.reset();
  PrivateChannel.prototype.disconnect.call(this);
};

module.exports = PresenceChannel;
