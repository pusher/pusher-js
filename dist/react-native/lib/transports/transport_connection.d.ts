import { default as EventsDispatcher } from "../events/dispatcher";
import ConnectionState from '../connection/state';
import TransportHooks from './transport_hooks';
import Socket from '../socket/socket';
/** Provides universal API for transport connections.
 *
 * Transport connection is a low-level object that wraps a connection method
 * and exposes a simple evented interface for the connection state and
 * messaging. It does not implement Pusher-specific WebSocket protocol.
 *
 * Additionally, it fetches resources needed for transport to work and exposes
 * an interface for querying transport features.
 *
 * States:
 * - new - initial state after constructing the object
 * - initializing - during initialization phase, usually fetching resources
 * - intialized - ready to establish a connection
 * - connection - when connection is being established
 * - open - when connection ready to be used
 * - closed - after connection was closed be either side
 *
 * Emits:
 * - error - after the connection raised an error
 *
 * Options:
 * - encrypted - whether connection should use ssl
 * - hostEncrypted - host to connect to when connection is encrypted
 * - hostUnencrypted - host to connect to when connection is not encrypted
 *
 * @param {String} key application key
 * @param {Object} options
 */
export default class TransportConnection extends EventsDispatcher {
    hooks: TransportHooks;
    name: string;
    priority: number;
    key: string;
    options: any;
    state: ConnectionState;
    timeline: any;
    activityTimeout: number;
    id: string;
    socket: Socket;
    beforeOpen: Function;
    constructor(hooks: TransportHooks, name: string, priority: number, key: string, options: any);
    /** Checks whether the transport handles activity checks by itself.
     *
     * @return {Boolean}
     */
    handlesActivityChecks(): boolean;
    /** Checks whether the transport supports the ping/pong API.
     *
     * @return {Boolean}
     */
    supportsPing(): boolean;
    /** Initializes the transport.
     *
     * Fetches resources if needed and then transitions to initialized.
     */
    initialize(): void;
    /** Tries to establish a connection.
     *
     * @returns {Boolean} false if transport is in invalid state
     */
    connect(): boolean;
    /** Closes the connection.
     *
     * @return {Boolean} true if there was a connection to close
     */
    close(): boolean;
    /** Sends data over the open connection.
     *
     * @param {String} data
     * @return {Boolean} true only when in the "open" state
     */
    send(data: any): boolean;
    /** Sends a ping if the connection is open and transport supports it. */
    ping(): void;
    /** @private */
    onOpen(): void;
    /** @private */
    onError(error: any): void;
    /** @private */
    onClose(closeEvent?: any): void;
    /** @private */
    onMessage(message: any): void;
    /** @private */
    onActivity(): void;
    /** @private */
    bindListeners(): void;
    /** @private */
    unbindListeners(): void;
    /** @private */
    changeState(state: ConnectionState, params?: any): void;
    buildTimelineMessage(message: any): any;
}
