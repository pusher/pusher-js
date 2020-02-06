import Reachability from 'core/reachability';
import { default as EventsDispatcher } from 'core/events/dispatcher';

/** Really basic interface providing network availability info.
 *
 * Emits:
 * - online - when browser goes online
 * - offline - when browser goes offline
 */
export class NetInfo extends EventsDispatcher implements Reachability {
  constructor() {
    super();
    var self = this;
    // This is okay, as IE doesn't support this stuff anyway.
    if (window.addEventListener !== undefined) {
      window.addEventListener(
        'online',
        function() {
          self.emit('online');
        },
        false
      );
      window.addEventListener(
        'offline',
        function() {
          self.emit('offline');
        },
        false
      );
    }
  }

  /** Returns whether browser is online or not
   *
   * Offline means definitely offline (no connection to router).
   * Inverse does NOT mean definitely online (only currently supported in Safari
   * and even there only means the device has a connection to the router).
   *
   * @return {Boolean}
   */
  isOnline(): boolean {
    if (window.navigator.onLine === undefined) {
      return true;
    } else {
      return window.navigator.onLine;
    }
  }
}

export var Network = new NetInfo();
