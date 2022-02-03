import Factory from '../utils/factory';
import Channel from './channel';
import { AuthorizerCallback } from '../auth/options';

/** Extends public channels to provide private channel interface.
 *
 * @param {String} name
 * @param {Pusher} pusher
 */
export default class PrivateChannel extends Channel {
  /** Authorizes the connection to use the channel.
   *
   * @param  {String} socketId
   * @param  {Function} callback
   */
  authorize(socketId: string, callback: AuthorizerCallback) {
    return this.pusher.config.channelAuthorizer(
      {
        channelName: this.name,
        socketId: socketId
      },
      callback
    );
  }
}
