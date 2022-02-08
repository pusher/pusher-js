import Channel from './channel';
import { ChannelAuthCallback } from '../auth/options';
export default class PrivateChannel extends Channel {
    authorize(socketId: string, callback: ChannelAuthCallback): void;
}
