import AssistantToTheTransportManager from './assistant_to_the_transport_manager';
import Transport from "./Transport";
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
    options: any;
    livesLeft: number;
    constructor(options: any);
    /** Creates a assistant for the transport.
     *
     * @param {Transport} transport
     * @returns {AssistantToTheTransportManager}
     */
    getAssistant(transport: Transport): AssistantToTheTransportManager;
    /** Returns whether the transport has any lives left.
     *
     * @returns {Boolean}
     */
    isAlive(): boolean;
    /** Takes one life from the transport. */
    reportDeath(): void;
}
