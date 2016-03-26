import { default as EventsDispatcher } from '../events/dispatcher';
import Factory from '../utils/factory';
/** Provides base public channel interface with an event emitter.
 *
 * Emits:
 * - pusher:subscription_succeeded - after subscribing successfully
 * - other non-internal events
 *
 * @param {String} name
 * @param {Pusher} pusher
 */
export default class Channel extends EventsDispatcher {
    name: string;
    pusher: any;
    subscribed: boolean;
    factory: Factory;
    constructor(factory: Factory, name: string, pusher: any);
    /** Skips authorization, since public channels don't require it.
     *
     * @param {Function} callback
     */
    authorize(socketId: string, callback: Function): any;
    /** Triggers an event */
    trigger(event: string, data: any): any;
    /** Signals disconnection to the channel. For internal use only. */
    disconnect(): void;
    /** Handles an event. For internal use only.
     *
     * @param {String} event
     * @param {*} data
     */
    handleEvent(event: string, data: any): void;
    /** Sends a subscription request. For internal use only. */
    subscribe(): void;
    /** Sends an unsubscription request. For internal use only. */
    unsubscribe(): void;
}
