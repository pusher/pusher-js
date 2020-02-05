import PrivateChannel from './private_channel';
import Members from './members';
import Pusher from '../pusher';
import { PusherEvent } from '../connection/protocol/message-types';
export default class PresenceChannel extends PrivateChannel {
    members: Members;
    constructor(name: string, pusher: Pusher);
    authorize(socketId: string, callback: Function): void;
    handleEvent(event: PusherEvent): void;
    handleInternalEvent(event: PusherEvent): void;
    handleSubscriptionSucceededEvent(event: PusherEvent): void;
    disconnect(): void;
}
