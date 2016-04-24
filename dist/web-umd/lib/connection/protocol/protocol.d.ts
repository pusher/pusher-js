import Action from './action';
import Message from './message';
import HandshakeResults from '../handshake/handshake_results';
export declare var decodeMessage: (message: Message) => Message;
export declare var encodeMessage: (message: Message) => string;
export declare var processHandshake: (message: Message) => Action;
export declare var getCloseAction: (closeEvent: any) => HandshakeResults;
export declare var getCloseError: (closeEvent: any) => any;
