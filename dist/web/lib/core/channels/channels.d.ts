import Channel from "./channel";
import ChannelTable from './channel_table';
import Client from '../client';
export default class Channels {
    channels: ChannelTable;
    constructor();
    add(name: string, pusher: Client): Channel;
    all(): Channel[];
    find(name: string): Channel;
    remove(name: string): Channel;
    disconnect(): void;
}
