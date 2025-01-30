import Util from '../util';
import * as Collections from '../utils/collections';
import TransportManager from './transport_manager';
import TransportConnection from './transport_connection';
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
export default class AssistantToTheTransportManager {
  manager: TransportManager;
  transport: Transport;
  minPingDelay: number;
  maxPingDelay: number;
  pingDelay: number;

  constructor(
    manager: TransportManager,
    transport: Transport,
    options: PingDelayOptions,
  ) {
    this.manager = manager;
    this.transport = transport;
    this.minPingDelay = options.minPingDelay;
    this.maxPingDelay = options.maxPingDelay;
    this.pingDelay = undefined;
  }

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
  createConnection(
    name: string,
    priority: number,
    key: string,
    options: Object,
  ): TransportConnection {
    options = Collections.extend({}, options, {
      activityTimeout: this.pingDelay,
    });
    var connection = this.transport.createConnection(
      name,
      priority,
      key,
      options,
    );

    var openTimestamp = null;

    var onOpen = function () {
      connection.unbind('open', onOpen);
      connection.bind('closed', onClosed);
      openTimestamp = Util.now();
    };
    var onClosed = (closeEvent) => {
      connection.unbind('closed', onClosed);

      if (closeEvent.code === 1002 || closeEvent.code === 1003) {
        // we don't want to use transports not obeying the protocol
        this.manager.reportDeath();
      } else if (!closeEvent.wasClean && openTimestamp) {
        // report deaths only for short-living transport
        var lifespan = Util.now() - openTimestamp;
        if (lifespan < 2 * this.maxPingDelay) {
          this.manager.reportDeath();
          this.pingDelay = Math.max(lifespan / 2, this.minPingDelay);
        }
      }
    };

    connection.bind('open', onOpen);
    return connection;
  }

  /** Returns whether the transport is supported in the environment.
   *
   * This function has the same API as Transport#isSupported. Might return false
   * when the manager decides to kill the transport.
   *
   * @param {Object} environment the environment details (encryption, settings)
   * @returns {Boolean} true when the transport is supported
   */
  isSupported(environment: string): boolean {
    return this.manager.isAlive() && this.transport.isSupported(environment);
  }
}
