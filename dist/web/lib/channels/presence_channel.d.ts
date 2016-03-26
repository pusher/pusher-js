import PrivateChannel from './private_channel';
import Members from './members';
export default class PresenceChannel extends PrivateChannel {
    members: Members;
    /** Adds presence channel functionality to private channels.
     *
     * @param {String} name
     * @param {Pusher} pusher
     */
    constructor(name: string, pusher: any);
    /** Authenticates the connection as a member of the channel.
     *
     * @param  {String} socketId
     * @param  {Function} callback
     */
    authorize(socketId: string, callback: Function): void;
    /** Handles presence and subscription events. For internal use only.
     *
     * @param {String} event
     * @param {*} data
     */
    handleEvent(event: string, data: any): void;
    /** Resets the channel state, including members map. For internal use only. */
    disconnect(): void;
}
