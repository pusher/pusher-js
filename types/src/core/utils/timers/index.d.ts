import Timer from './abstract_timer';
import TimedCallback from './timed_callback';
import { Delay } from './scheduling';
export declare class OneOffTimer extends Timer {
    constructor(delay: Delay, callback: TimedCallback);
}
export declare class PeriodicTimer extends Timer {
    constructor(delay: Delay, callback: TimedCallback);
}
