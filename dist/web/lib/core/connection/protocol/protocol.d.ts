import Action from './action';
import Message from './message';
export declare var decodeMessage: (message: Message) => Message;
export declare var encodeMessage: (message: Message) => string;
export declare var processHandshake: (message: Message) => Action;
export declare var getCloseAction: (closeEvent: any) => string;
export declare var getCloseError: (closeEvent: any) => any;
