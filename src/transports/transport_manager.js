;(function() {
  function TransportManager(transport, options) {
    this.transport = transport;
    this.livesLeft = options.lives || Infinity;
    this.minPingDelay = options.minPingDelay || 10000;
    this.maxPingDelay = options.maxPingDelay || Pusher.activity_timeout;
    this.pingDelay = null;
  }
  var prototype = TransportManager.prototype;

  prototype.createConnection = function(name, priority, key, options) {
    var connection = this.transport.createConnection(
      name, priority, key, options
    );

    var self = this;
    var openTimestamp = null;
    var pingTimer = null;

    var onOpen = function() {
      connection.unbind("open", onOpen);

      openTimestamp = Pusher.Util.now();
      if (self.pingDelay) {
        pingTimer = setInterval(function() {
          if (pingTimer) {
            connection.requestPing();
          }
        }, self.pingDelay);
      }

      connection.bind("closed", onClosed);
    };
    var onClosed = function(closeEvent) {
      connection.unbind("closed", onClosed);
      if (pingTimer) {
        clearInterval(pingTimer);
        pingTimer = null;
      }

      if (closeEvent.wasClean) {
        return;
      }

      self.livesLeft--;
      if (openTimestamp) {
        var newInterval = Math.max(
          (Pusher.Util.now() - openTimestamp) / 2, self.minPingDelay
        );
        if (newInterval < self.maxPingDelay) {
          self.pingDelay = newInterval;
        }
      }
    };

    connection.bind("open", onOpen);
    return connection;
  };

  prototype.isSupported = function() {
    return this.livesLeft > 0 && this.transport.isSupported();
  };

  Pusher.TransportManager = TransportManager;
}).call(this);
