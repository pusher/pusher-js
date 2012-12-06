;(function() {
  /*
    A little bauble to interface with window.navigator.onLine,
    window.ononline and window.onoffline.  Easier to mock.
  */

  var NetInfo = new Pusher.EventsDispatcher();

  // This is okay, as IE doesn't support this stuff anyway.
  if (window.addEventListener !== undefined) {
    window.addEventListener("online", function() {
      NetInfo.emit('online', null);
    }, false);
    window.addEventListener("offline", function() {
      NetInfo.emit('offline', null);
    }, false);
  }

  // Offline means definitely offline (no connection to router).
  // Inverse does NOT mean definitely online (only currently supported in Safari
  // and even there only means the device has a connection to the router).
  NetInfo.isOnline = function() {
    if (window.navigator.onLine === undefined) {
      return true;
    } else {
      return window.navigator.onLine;
    }
  };

  this.Pusher.NetInfo = NetInfo;
}).call(this);
