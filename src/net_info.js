;(function() {

  // Basic interface for querying network availability.
  function NetInfo() {
    Pusher.EventsDispatcher.call(this);

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
  Pusher.Util.extend(NetInfo.prototype, Pusher.EventsDispatcher.prototype);

  var prototype = NetInfo.prototype;

  // Offline means definitely offline (no connection to router).
  // Inverse does NOT mean definitely online (only currently supported in Safari
  // and even there only means the device has a connection to the router).
  prototype.isOnline = function() {
    if (window.navigator.onLine === undefined) {
      return true;
    } else {
      return window.navigator.onLine;
    }
  };

  Pusher.NetInfo = NetInfo;
  Pusher.Network = new NetInfo();

}).call(this);
