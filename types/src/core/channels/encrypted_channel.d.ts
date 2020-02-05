import PrivateChannel from './private_channel';
import Dispatcher from '../events/dispatcher';
import { PusherEvent } from '../connection/protocol/message-types';
import { AuthorizerCallback } from '../auth/options';
export default class EncryptedChannel extends PrivateChannel {
    key: Uint8Array;
    authorize(socketId: string, callback: AuthorizerCallback): void;
    trigger(event: string, data: any): boolean;
    handleEvent(event: PusherEvent): void;
    private handleEncryptedEvent;
    emitJSON(eventName: string, data?: any): Dispatcher;
}
