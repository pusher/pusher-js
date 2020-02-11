import Action from './action';
import { PusherEvent } from './message-types';
declare const Protocol: {
    decodeMessage: (messageEvent: MessageEvent) => PusherEvent;
    encodeMessage: (event: PusherEvent) => string;
    processHandshake: (messageEvent: MessageEvent) => Action;
    getCloseAction: (closeEvent: any) => string;
    getCloseError: (closeEvent: any) => any;
};
export default Protocol;
