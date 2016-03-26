import HTTPFactory from "./http_factory";
import URLLocation from "./url_location";
import State from "./state";
import Socket from "../socket/socket";
import SocketHooks from "./socket_hooks";
import HTTPRequest from "./http_request";
declare class HTTPSocket implements Socket {
    hooks: SocketHooks;
    session: string;
    location: URLLocation;
    readyState: State;
    stream: HTTPRequest;
    factory: HTTPFactory;
    onopen: () => void;
    onerror: (error: any) => void;
    onclose: (closeEvent: any) => void;
    onmessage: (message: any) => void;
    onactivity: () => void;
    constructor(factory: HTTPFactory, hooks: SocketHooks, url: string);
    send(payload: any): boolean;
    ping(): void;
    close(code: any, reason: any): void;
    /** For internal use only */
    sendRaw(payload: any): boolean;
    /** For internal use only */
    reconnect(): void;
    /** For internal use only */
    onClose(code: any, reason: any, wasClean: any): void;
    /** @private */
    onChunk(chunk: any): void;
    /** @private */
    onOpen(options: any): void;
    /** @private */
    onEvent(event: any): void;
    /** @private */
    onActivity(): void;
    /** @private */
    onError(error: any): void;
    /** @private */
    openStream(): void;
    /** @private */
    closeStream(): void;
}
export default HTTPSocket;
