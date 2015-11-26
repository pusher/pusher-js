var Channel = require('./channel');
var PresenceChannel = require('./presence_channel');
var PrivateChannel = require('./private_channel');
var Util = require('../util');

/** Handles a channel map. */
function Channels() {
  this.channels = {};
}
var prototype = Channels.prototype;

/** Creates or retrieves an existing channel by its name.
 *
 * @param {String} name
 * @param {Pusher} pusher
 * @return {Channel}
 */
prototype.add = function(name, pusher) {
  if (!this.channels[name]) {
    this.channels[name] = createChannel(name, pusher);
  }
  return this.channels[name];
};

/** Returns a list of all channels
 *
 * @return {Array}
 */
prototype.all = function(name) {
  return Util.values(this.channels);
};

/** Finds a channel by its name.
 *
 * @param {String} name
 * @return {Channel} channel or null if it doesn't exist
 */
prototype.find = function(name) {
  return this.channels[name];
};

/** Removes a channel from the map.
 *
 * @param {String} name
 */
prototype.remove = function(name) {
  var channel = this.channels[name];
  delete this.channels[name];
  return channel;
};

/** Proxies disconnection signal to all channels. */
prototype.disconnect = function() {
  Util.objectApply(this.channels, function(channel) {
    channel.disconnect();
  });
};

function createChannel(name, pusher) {
  if (name.indexOf('private-') === 0) {
    return new PrivateChannel(name, pusher);
  } else if (name.indexOf('presence-') === 0) {
    return new PresenceChannel(name, pusher);
  } else {
    return new Channel(name, pusher);
  }
}

module.exports = Channels;
