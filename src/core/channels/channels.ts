import Channel from './channel';
import * as Collections from '../utils/collections';
import ChannelTable from './channel_table';
import Factory from '../utils/factory';
import Pusher from '../pusher';
import Logger from '../logger';
import * as Errors from '../errors';
import urlStore from '../utils/url_store';

/** Handles a channel map. */
export default class Channels {
  channels: ChannelTable;

  constructor() {
    this.channels = {};
  }

  /** Creates or retrieves an existing channel by its name.
   *
   * @param {String} name
   * @param {Pusher} pusher
   * @return {Channel}
   */
  add(name: string, pusher: Pusher) {
    if (!this.channels[name]) {
      this.channels[name] = createChannel(name, pusher);
    }
    return this.channels[name];
  }

  /** Returns a list of all channels
   *
   * @return {Array}
   */
  all(): Channel[] {
    return Collections.values(this.channels);
  }

  /** Finds a channel by its name.
   *
   * @param {String} name
   * @return {Channel} channel or null if it doesn't exist
   */
  find(name: string) {
    return this.channels[name];
  }

  /** Removes a channel from the map.
   *
   * @param {String} name
   */
  remove(name: string) {
    var channel = this.channels[name];
    delete this.channels[name];
    return channel;
  }

  /** Proxies disconnection signal to all channels. */
  disconnect() {
    Collections.objectApply(this.channels, function(channel) {
      channel.disconnect();
    });
  }
}

function createChannel(name: string, pusher: Pusher): Channel {
  if (name.indexOf('private-encrypted-') === 0) {
    if (pusher.config.nacl) {
      return Factory.createEncryptedChannel(name, pusher, pusher.config.nacl);
    }
    let errMsg =
      'Tried to subscribe to a private-encrypted- channel but no nacl implementation available';
    let suffix = urlStore.buildLogSuffix('encryptedChannelSupport');
    throw new Errors.UnsupportedFeature(`${errMsg}. ${suffix}`);
  } else if (name.indexOf('private-') === 0) {
    return Factory.createPrivateChannel(name, pusher);
  } else if (name.indexOf('presence-') === 0) {
    return Factory.createPresenceChannel(name, pusher);
  } else {
    return Factory.createChannel(name, pusher);
  }
}
