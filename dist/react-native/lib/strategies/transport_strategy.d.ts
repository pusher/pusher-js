import Strategy from './strategy';
import Transport from '../transports/transport';
import StrategyOptions from './strategy_options';
/** Provides a strategy interface for transports.
 *
 * @param {String} name
 * @param {Number} priority
 * @param {Class} transport
 * @param {Object} options
 */
export default class TransportStrategy implements Strategy {
    name: string;
    priority: number;
    transport: Transport;
    options: any;
    constructor(name: string, priority: number, transport: Transport, options: StrategyOptions);
    /** Returns whether the transport is supported in the browser.
     *
     * @returns {Boolean}
     */
    isSupported(): boolean;
    /** Launches a connection attempt and returns a strategy runner.
     *
     * @param  {Function} callback
     * @return {Object} strategy runner
     */
    connect(minPriority: number, callback: Function): {
        abort: () => void;
        forceMinPriority: (p: any) => void;
    };
}
