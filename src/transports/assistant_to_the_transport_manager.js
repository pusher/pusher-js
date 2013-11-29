;(function() {
  function AssistantToTheTransportManager(manager, transport, options) {
    this.manager = manager;
    this.transport = transport;
    this.minPingDelay = options.minPingDelay;
    this.maxPingDelay = options.maxPingDelay;
    this.pingDelay = undefined;
  }
  var prototype = AssistantToTheTransportManager.prototype;

  prototype.createConnection = function(name, priority, key, options) {
    var self = this;

    var options = Pusher.Util.extend({}, options, {
      activityTimeout: self.pingDelay
    });
    var connection = self.transport.createConnection(
      name, priority, key, options
    );

    var openTimestamp = null;

    var onOpen = function() {
      connection.unbind("open", onOpen);
      connection.bind("closed", onClosed);
      openTimestamp = Pusher.Util.now();
    };
    var onClosed = function(closeEvent) {
      connection.unbind("closed", onClosed);

      if (closeEvent.code === 1002 || closeEvent.code === 1003) {
        // we don't want to use transports not obeying the protocol
        self.manager.reportDeath();
      } else if (!closeEvent.wasClean && openTimestamp) {
        // report deaths only for short-living transport
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

  prototype.isSupported = function() {
    return this.manager.isAlive() && this.transport.isSupported();
  };

  Pusher.AssistantToTheTransportManager = AssistantToTheTransportManager;
}).call(this);
