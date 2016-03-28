import { default as EventsDispatcher } from '../events/dispatcher';
import TransportConnection from "../transports/transport_connection";
import Socket from "../socket/socket";
/**
 * Provides Pusher protocol interface for transports.
 *
 * Emits following events:
 * - message - on received messages
 * - ping - on ping requests
 * - pong - on pong responses
 * - error - when the transport emits an error
 * - closed - after closing the transport
 *
 * It also emits more events when connection closes with a code.
 * See Protocol.getCloseAction to get more details.
 *
 * @param {Number} id
 * @param {AbstractTransport} transport
 */
export default class Connection extends EventsDispatcher implements Socket {
    id: string;
    transport: TransportConnection;
    activityTimeout: number;
    constructor(id: string, transport: TransportConnection);
    /** Returns whether used transport handles activity checks by itself
     *
     * @returns {Boolean} true if activity checks are handled by the transport
     */
    handlesActivityChecks(): boolean;
    /** Sends raw data.
     *
     * @param {String} data
     */
    send(data: any): boolean;
    /** Sends an event.
     *
     * @param {String} name
     * @param {String} data
     * @param {String} [channel]
     * @returns {Boolean} whether message was sent or not
     */
    send_event(name: string, data: any, channel?: string): boolean;
    /** Sends a ping message to the server.
     *
     * Basing on the underlying transport, it might send either transport's
     * protocol-specific ping or pusher:ping event.
     */
    ping(): void;
    /** Closes the connection. */
    close(): void;
    /** @private */
    bindListeners(): void;
    /** @private */
    handleCloseEvent(closeEvent: any): void;
}
