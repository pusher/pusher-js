import PrivateChannel from './private_channel';
import Members from './members';
import Client from '../client';
export default class PresenceChannel extends PrivateChannel {
    members: Members;
    constructor(name: string, pusher: Client);
    authorize(socketId: string, callback: Function): void;
    handleEvent(event: string, data: any): void;
    disconnect(): void;
}
