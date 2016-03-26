import Channel from "./channel";
import PresenceChannel from './presence_channel';
import PrivateChannel from './private_channel';
import * as Collections from '../utils/collections';
import ChannelTable from './channel_table';
import Factory from '../utils/factory';

/** Handles a channel map. */
export default class Channels {
  channels: ChannelTable;
  factory: Factory;

  constructor(factory: Factory) {
    this.factory = factory;
    this.channels = {};
  }

  /** Creates or retrieves an existing channel by its name.
   *
   * @param {String} name
   * @param {Pusher} pusher
   * @return {Channel}
   */
  add(name : string, pusher : any) {
    if (!this.channels[name]) {
      this.channels[name] = createChannel(this.factory, name, pusher);
    }
    return this.channels[name];
  }

  /** Returns a list of all channels
   *
   * @return {Array}
   */
  all() : Channel[] {
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
  remove(name : string) {
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

function createChannel(factory: Factory, name : string, pusher : any) : Channel {
  if (name.indexOf('private-') === 0) {
    return new PrivateChannel(factory, name, pusher);
  } else if (name.indexOf('presence-') === 0) {
    return new PresenceChannel(factory, name, pusher);
  } else {
    return new Channel(factory, name, pusher);
  }
}
