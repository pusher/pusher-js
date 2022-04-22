import Channel from './channel';
import { ChannelAuthorizationCallback } from '../auth/options';
export default class PrivateChannel extends Channel {
    authorize(socketId: string, callback: ChannelAuthorizationCallback): void;
}
