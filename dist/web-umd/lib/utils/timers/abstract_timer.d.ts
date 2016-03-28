import TimedCallback from "./timed_callback";
import { Delay, Scheduler, Canceller } from "./scheduling";
declare abstract class Timer {
    protected clear: Canceller;
    protected timer: number | void;
    constructor(set: Scheduler, clear: Canceller, delay: Delay, callback: TimedCallback);
    /** Returns whether the timer is still running.
     *
     * @return {Boolean}
     */
    isRunning(): boolean;
    /** Aborts a timer when it's running. */
    ensureAborted(): void;
}
export default Timer;
