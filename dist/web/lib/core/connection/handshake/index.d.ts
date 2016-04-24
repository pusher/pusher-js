import TransportConnection from "../../transports/transport_connection";
export default class Handshake {
    transport: TransportConnection;
    callback: (HandshakePayload) => void;
    onMessage: Function;
    onClosed: Function;
    constructor(transport: TransportConnection, callback: (HandshakePayload) => void);
    close(): void;
    private bindListeners();
    private unbindListeners();
    private finish(action, params);
}
