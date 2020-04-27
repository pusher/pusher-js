import PrivateChannel from './private_channel';
import Pusher from '../pusher';
import Dispatcher from '../events/dispatcher';
import { PusherEvent } from '../connection/protocol/message-types';
import { AuthorizerCallback } from '../auth/options';
import * as nacl from 'tweetnacl';
export default class EncryptedChannel extends PrivateChannel {
    key: Uint8Array;
    nacl: nacl;
    constructor(name: string, pusher: Pusher, nacl: nacl);
    authorize(socketId: string, callback: AuthorizerCallback): void;
    trigger(event: string, data: any): boolean;
    handleEvent(event: PusherEvent): void;
    private handleEncryptedEvent;
    emitJSON(eventName: string, data?: any): Dispatcher;
}
