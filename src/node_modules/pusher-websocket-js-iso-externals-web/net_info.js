var EventsDispatcher = require('../../events_dispatcher');
var Util = require('../../util');

/** Really basic interface providing network availability info.
 *
 * Emits:
 * - online - when browser goes online
 * - offline - when browser goes offline
 */
function NetInfo() {
  EventsDispatcher.call(this);

  var self = this;
  // This is okay, as IE doesn't support this stuff anyway.
  if (window.addEventListener !== undefined) {
    window.addEventListener("online", function() {
      self.emit('online');
    }, false);
    window.addEventListener("offline", function() {
      self.emit('offline');
    }, false);
  }
}
Util.extend(NetInfo.prototype, EventsDispatcher.prototype);

var prototype = NetInfo.prototype;

/** Returns whether browser is online or not
 *
 * Offline means definitely offline (no connection to router).
 * Inverse does NOT mean definitely online (only currently supported in Safari
 * and even there only means the device has a connection to the router).
 *
 * @return {Boolean}
 */
prototype.isOnline = function() {
  if (window.navigator.onLine === undefined) {
    return true;
  } else {
    return window.navigator.onLine;
  }
};

exports.NetInfo = NetInfo;
exports.Network = new NetInfo();
