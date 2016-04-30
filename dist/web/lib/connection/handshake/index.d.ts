import TransportConnection from "node/transport_connection";
export default class Handshake {
    transport: TransportConnection;
    callback: (HandshakePayload) => void;
    onMessage: Function;
    onClosed: Function;
    constructor(transport: TransportConnection, callback: (HandshakePayload) => void);
    close(): void;
    bindListeners(): void;
    unbindListeners(): void;
    finish(action: any, params: any): void;
}