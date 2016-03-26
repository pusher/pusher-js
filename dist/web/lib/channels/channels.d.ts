import Channel from "./channel";
import ChannelTable from './channel_table';
import Factory from '../utils/factory';
/** Handles a channel map. */
export default class Channels {
    channels: ChannelTable;
    factory: Factory;
    constructor(factory: Factory);
    /** Creates or retrieves an existing channel by its name.
     *
     * @param {String} name
     * @param {Pusher} pusher
     * @return {Channel}
     */
    add(name: string, pusher: any): Channel;
    /** Returns a list of all channels
     *
     * @return {Array}
     */
    all(): Channel[];
    /** Finds a channel by its name.
     *
     * @param {String} name
     * @return {Channel} channel or null if it doesn't exist
     */
    find(name: string): Channel;
    /** Removes a channel from the map.
     *
     * @param {String} name
     */
    remove(name: string): Channel;
    /** Proxies disconnection signal to all channels. */
    disconnect(): void;
}
