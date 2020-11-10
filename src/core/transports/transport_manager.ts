import AssistantToTheTransportManager from './assistant_to_the_transport_manager';
import Transport from './transport';
import PingDelayOptions from './ping_delay_options';
import Factory from '../utils/factory';
import { OneOffTimer } from '../utils/timers';

export interface TransportManagerOptions extends PingDelayOptions {
  lives?: number;
  connectionSucceedsAfter?: number;
}

/** Keeps track of the number of lives left for a transport.
 *
 * In the beginning of a session, transports may be assigned a number of
 * lives. When an AssistantToTheTransportManager instance reports a transport
 * connection closed uncleanly, the transport loses a life. When the number
 * of lives drops to zero, the transport gets disabled by its manager.
 *
 * @param {Object} options
 */
export default class TransportManager {
  options: TransportManagerOptions;
  livesLeft: number;
  successfulConnectionTimer: OneOffTimer | null;
  connectionSucceedsAfter: number;

  constructor(options: TransportManagerOptions) {
    this.options = options || {};
    this.livesLeft = this.options.lives || Infinity;
    this.successfulConnectionTimer = null;
    this.connectionSucceedsAfter = this.options.connectionSucceedsAfter || 5;
  }

  /** Creates a assistant for the transport.
   *
   * @param {Transport} transport
   * @returns {AssistantToTheTransportManager}
   */
  getAssistant(transport: Transport): AssistantToTheTransportManager {
    return Factory.createAssistantToTheTransportManager(this, transport, {
      minPingDelay: this.options.minPingDelay,
      maxPingDelay: this.options.maxPingDelay
    });
  }

  /** Returns whether the transport has any lives left.
   *
   * @returns {Boolean}
   */
  isAlive(): boolean {
    return this.livesLeft > 0;
  }

  /** Takes one life from the transport. */
  reportDeath() {
    if (this.successfulConnectionTimer) {
      this.successfulConnectionTimer.ensureAborted();
      this.successfulConnectionTimer = null;
    }
    this.livesLeft -= 1;
  }

  reportConnection() {
    this.successfulConnectionTimer = new OneOffTimer(
      this.connectionSucceedsAfter,
      this.reportSuccessfulConnection
    );
  }

  /** Adds one life to the transport. */
  reportSuccessfulConnection() {
    if (this.livesLeft < this.options.lives) {
      this.livesLeft += 1;
    }
  }
}
