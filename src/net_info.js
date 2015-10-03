;(function() {
  /** Really basic interface providing network availability info.
   *
   * Emits:
   * - online - when browser goes online
   * - offline - when browser goes offline
   */

  var _window = Pusher.runtime.getWindow();

  function NetInfo() {
    Pusher.EventsDispatcher.call(this);

    var self = this;
    // This is okay, as IE doesn't support this stuff anyway.
    if (_window.addEventListener !== undefined) {
      _window.addEventListener("online", function() {
        self.emit('online');
      }, false);
      _window.addEventListener("offline", function() {
        self.emit('offline');
      }, false);
    }
  }
  Pusher.Util.extend(NetInfo.prototype, Pusher.EventsDispatcher.prototype);

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
    if (_window.navigator.onLine === undefined) {
      return true;
    } else {
      return _window.navigator.onLine;
    }
  };

  Pusher.NetInfo = NetInfo;
  Pusher.Network = new NetInfo();
}).call(this);
