;(function() {
  function TransportManager(transport) {
    this.transport = transport;
    this.livesLeft = 2;
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
          (Pusher.Util.now() - openTimestamp) / 2, 10000
        );
        if (newInterval < 60000) {
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
