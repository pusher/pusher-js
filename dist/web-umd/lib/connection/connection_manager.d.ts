import { default as EventsDispatcher } from '../events/dispatcher';
import { OneOffTimer as Timer } from '../utils/timers';
import ConnectionState from './state';
import Connection from "./connection";
import Strategy from "../strategies/strategy";
import StrategyRunner from "../strategies/strategy_runner";
/** Manages connection to Pusher.
 *
 * Uses a strategy (currently only default), timers and network availability
 * info to establish a connection and export its state. In case of failures,
 * manages reconnection attempts.
 *
 * Exports state changes as following events:
 * - "state_change", { previous: p, current: state }
 * - state
 *
 * States:
 * - initialized - initial state, never transitioned to
 * - connecting - connection is being established
 * - connected - connection has been fully established
 * - disconnected - on requested disconnection
 * - unavailable - after connection timeout or when there's no network
 * - failed - when the connection strategy is not supported
 *
 * Options:
 * - unavailableTimeout - time to transition to unavailable state
 * - activityTimeout - time after which ping message should be sent
 * - pongTimeout - time for Pusher to respond with pong before reconnecting
 *
 * @param {String} key application key
 * @param {Object} options
 */
export default class ConnectionManager extends EventsDispatcher {
    key: string;
    options: any;
    state: ConnectionState;
    connection: Connection;
    encrypted: boolean;
    timeline: any;
    socket_id: string;
    unavailableTimer: Timer;
    activityTimer: Timer;
    retryTimer: Timer;
    activityTimeout: number;
    strategy: Strategy;
    runner: StrategyRunner;
    errorCallbacks: any;
    handshakeCallbacks: any;
    connectionCallbacks: any;
    constructor(key: string, options: any);
    /** Establishes a connection to Pusher.
     *
     * Does nothing when connection is already established. See top-level doc
     * to find events emitted on connection attempts.
     */
    connect(): void;
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
    /** Closes the connection. */
    disconnect(): void;
    isEncrypted(): boolean;
    /** @private */
    startConnecting(): void;
    /** @private */
    abortConnecting(): void;
    /** @private */
    disconnectInternally(): void;
    /** @private */
    updateStrategy(): void;
    /** @private */
    retryIn(delay: any): void;
    /** @private */
    clearRetryTimer(): void;
    /** @private */
    setUnavailableTimer(): void;
    /** @private */
    clearUnavailableTimer(): void;
    /** @private */
    sendActivityCheck(): void;
    /** @private */
    resetActivityCheck(): void;
    /** @private */
    stopActivityCheck(): void;
    /** @private */
    buildConnectionCallbacks(): {
        message: (message: any) => void;
        ping: () => void;
        activity: () => void;
        error: (error: any) => void;
        closed: () => void;
    };
    /** @private */
    buildHandshakeCallbacks(errorCallbacks: any): any;
    /** @private */
    buildErrorCallbacks(): {
        ssl_only: (result: any) => void;
        refused: (result: any) => void;
        backoff: (result: any) => void;
        retry: (result: any) => void;
    };
    /** @private */
    setConnection(connection: any): void;
    /** @private */
    abandonConnection(): Connection;
    /** @private */
    updateState(newState: ConnectionState, data?: any): void;
    /** @private */
    shouldRetry(): boolean;
}
