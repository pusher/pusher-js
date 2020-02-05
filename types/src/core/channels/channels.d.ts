import Channel from './channel';
import ChannelTable from './channel_table';
import Pusher from '../pusher';
export default class Channels {
    channels: ChannelTable;
    constructor();
    add(name: string, pusher: Pusher): Channel;
    all(): Channel[];
    find(name: string): Channel;
    remove(name: string): Channel;
    disconnect(): void;
}
