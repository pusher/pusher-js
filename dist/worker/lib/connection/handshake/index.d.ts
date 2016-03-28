import TransportConnection from "../../transports/transport_connection";
/**
 * Handles Pusher protocol handshakes for transports.
 *
 * Calls back with a result object after handshake is completed. Results
 * always have two fields:
 * - action - string describing action to be taken after the handshake
 * - transport - the transport object passed to the constructor
 *
 * Different actions can set different additional properties on the result.
 * In the case of 'connected' action, there will be a 'connection' property
 * containing a Connection object for the transport. Other actions should
 * carry an 'error' property.
 *
 * @param {AbstractTransport} transport
 * @param {Function} callback
 */
export default class Handshake {
    transport: TransportConnection;
    callback: (HandshakePayload) => void;
    onMessage: Function;
    onClosed: Function;
    constructor(transport: TransportConnection, callback: (HandshakePayload) => void);
    close(): void;
    /** @private */
    bindListeners(): void;
    /** @private */
    unbindListeners(): void;
    /** @private */
    finish(action: any, params: any): void;
}
