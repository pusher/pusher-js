var Channel = require('./channel');
var Util = require('../util');

/** Extends public channels to provide private channel interface.
 *
 * @param {String} name
 * @param {Pusher} pusher
 */
function PrivateChannel(name, pusher) {
  Channel.call(this, name, pusher);
}
var prototype = PrivateChannel.prototype;
Util.extend(prototype, Channel.prototype);

/** Authorizes the connection to use the channel.
 *
 * @param  {String} socketId
 * @param  {Function} callback
 */
prototype.authorize = function(socketId, callback) {
  var authorizer = new Channel.Authorizer(this, this.pusher.config);
  return authorizer.authorize(socketId, callback);
};

module.exports = PrivateChannel;
