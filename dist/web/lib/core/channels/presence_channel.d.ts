import PrivateChannel from './private_channel';
import Members from './members';
import Pusher from '../pusher';
export default class PresenceChannel extends PrivateChannel {
    members: Members;
    constructor(name: string, pusher: Pusher);
    authorize(socketId: string, callback: Function): void;
    handleEvent(event: string, data: any): void;
    disconnect(): void;
}
