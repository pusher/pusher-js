import TransportManager from './transport_manager';
import Transport from './transport';
import PingDelayOptions from './ping_delay_options';
/** Creates transport connections monitored by a transport manager.
 *
 * When a transport is closed, it might mean the environment does not support
 * it. It's possible that messages get stuck in an intermediate buffer or
 * proxies terminate inactive connections. To combat these problems,
 * assistants monitor the connection lifetime, report unclean exits and
 * adjust ping timeouts to keep the connection active. The decision to disable
 * a transport is the manager's responsibility.
 *
 * @param {TransportManager} manager
 * @param {TransportConnection} transport
 * @param {Object} options
 */
export default class AssistantToTheTransportManager implements PingDelayOptions {
    manager: TransportManager;
    transport: Transport;
    minPingDelay: number;
    maxPingDelay: number;
    pingDelay: number;
    constructor(manager: TransportManager, transport: Transport, options: any);
    /** Creates a transport connection.
     *
     * This function has the same API as Transport#createConnection.
     *
     * @param {String} name
     * @param {Number} priority
     * @param {String} key the application key
     * @param {Object} options
     * @returns {TransportConnection}
     */
    createConnection(name: string, priority: number, key: string, options: Object): any;
    /** Returns whether the transport is supported in the environment.
     *
     * This function has the same API as Transport#isSupported. Might return false
     * when the manager decides to kill the transport.
     *
     * @param {Object} environment the environment details (encryption, settings)
     * @returns {Boolean} true when the transport is supported
     */
    isSupported(environment: any): boolean;
}
