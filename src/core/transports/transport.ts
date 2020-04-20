import Factory from '../utils/factory';
import TransportHooks from './transport_hooks';
import TransportConnection from './transport_connection';
import TransportConnectionOptions from './transport_connection_options';

/** Provides interface for transport connection instantiation.
 *
 * Takes transport-specific hooks as the only argument, which allow checking
 * for transport support and creating its connections.
 *
 * Supported hooks: * - file - the name of the file to be fetched during initialization
 * - urls - URL scheme to be used by transport
 * - handlesActivityCheck - true when the transport handles activity checks
 * - supportsPing - true when the transport has a ping/activity API
 * - isSupported - tells whether the transport is supported in the environment
 * - getSocket - creates a WebSocket-compatible transport socket
 *
 * See transports.js for specific implementations.
 *
 * @param {Object} hooks object containing all needed transport hooks
 */
export default class Transport {
  hooks: TransportHooks;

  constructor(hooks: TransportHooks) {
    this.hooks = hooks;
  }

  /** Returns whether the transport is supported in the environment.
   *
   * @param {Object} envronment te environment details (encryption, settings)
   * @returns {Boolean} true when the transport is supported
   */
  isSupported(environment: any): boolean {
    return this.hooks.isSupported(environment);
  }

  /** Creates a transport connection.
   *
   * @param {String} name
   * @param {Number} priority
   * @param {String} key the application key
   * @param {Object} options
   * @returns {TransportConnection}
   */
  createConnection(
    name: string,
    priority: number,
    key: string,
    options: any
  ): TransportConnection {
    return new TransportConnection(this.hooks, name, priority, key, options);
  }
}
