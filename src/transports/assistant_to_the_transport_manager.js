;(function() {
  function AssistantToTheTransportManager(manager, transport, options) {
    this.manager = manager;
    this.transport = transport;
    this.minPingDelay = options.minPingDelay || 10000;
    this.maxPingDelay = options.maxPingDelay || Pusher.activity_timeout;
    this.pingDelay = null;
  }
  var prototype = AssistantToTheTransportManager.prototype;

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

      if (openTimestamp) {
        var lifespan = Pusher.Util.now() - openTimestamp;
        if (lifespan < 2 * self.maxPingDelay) {
          self.manager.reportDeath();
          self.pingDelay = Math.max(lifespan / 2, self.minPingDelay);
        }
      }
    };

    connection.bind("open", onOpen);
    return connection;
  };

  prototype.isSupported = function(environment) {
    return this.manager.isAlive() && this.transport.isSupported(environment);
  };

  Pusher.AssistantToTheTransportManager = AssistantToTheTransportManager;
}).call(this);
