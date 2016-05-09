import Factory from "../utils/factory";
import Channel from './channel';

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
  authorize(socketId : string, callback : Function) {
    var authorizer = Factory.createAuthorizer(this, this.pusher.config);
    return authorizer.authorize(socketId, callback);
  }

}
