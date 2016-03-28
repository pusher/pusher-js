import Timer from "./abstract_timer";
import TimedCallback from "./timed_callback";
import { Delay } from "./scheduling";
/** Cross-browser compatible one-off timer abstraction.
 *
 * @param {Number} delay
 * @param {Function} callback
 */
export declare class OneOffTimer extends Timer {
    constructor(delay: Delay, callback: TimedCallback);
}
/** Cross-browser compatible periodic timer abstraction.
 *
 * @param {Number} delay
 * @param {Function} callback
 */
export declare class PeriodicTimer extends Timer {
    constructor(delay: Delay, callback: TimedCallback);
}
