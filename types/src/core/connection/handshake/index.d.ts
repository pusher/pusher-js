import TransportConnection from '../../transports/transport_connection';
export default class Handshake {
    transport: TransportConnection;
    callback: (HandshakePayload: any) => void;
    onMessage: Function;
    onClosed: Function;
    constructor(transport: TransportConnection, callback: (HandshakePayload: any) => void);
    close(): void;
    private bindListeners;
    private unbindListeners;
    private finish;
}
