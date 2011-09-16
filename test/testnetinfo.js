/**
   Mocks the NetInfo

   Note: only some browser versions support the functionality this mocks.
   See supported and unsupported notes below.

   onLine:
     Supported: true when browser can talk to local router, false otherwise.
     Unsupported: always true.

   online event:
     Supported: fired when browser gets a connection to local router.
     Unsupported: never fired.

   offline event:
     Supported: fired when browser gets loses its connection to local router.
     Unsupported: never fired.
 **/

;(function() {
  var TestNetInfo = function() {
    this.onLine = true;
    Pusher.EventsDispatcher.call(this)
  };

  TestNetInfo.prototype.isOnLine = function() {
    return this.onLine;
  },

  // makes like this obj can talk to a router on the local network
  TestNetInfo.prototype.plugIn = function() {
    this.onLine = true;
    this.emit('online', null);
  };

  // makes like this obj can no longer talk to a router on the local network
  TestNetInfo.prototype.unplug = function() {
    this.onLine = false;
    this.emit('offline', null);
  };

  Pusher.Util.extend(TestNetInfo.prototype, Pusher.EventsDispatcher.prototype)
  this.TestNetInfo = TestNetInfo;
}).call(this);