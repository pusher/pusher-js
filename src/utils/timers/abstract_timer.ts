import TimedCallback from "./timed_callback";
import {Delay, Scheduler, Canceller} from "./scheduling";

abstract class Timer {
  protected clear: Canceller;
  protected timer: number | void;

  constructor(set: Scheduler, clear: Canceller, delay: Delay, callback: TimedCallback) {
    this.clear = clear;
    this.timer = set(() => {
      if (this.timer) {
        this.timer = callback(this.timer);
      }
    }, delay);
  }

  /** Returns whether the timer is still running.
   *
   * @return {Boolean}
   */
  isRunning(): boolean {
    return this.timer !== null;
  }

  /** Aborts a timer when it's running. */
  ensureAborted() {
    if (this.timer) {
      this.clear(this.timer);
      this.timer = null;
    }
  }
}

export default Timer;
