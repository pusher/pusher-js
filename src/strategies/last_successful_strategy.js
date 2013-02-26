;(function() {
  /** Caches last successful transport and uses it for following attempts.
   *
   * @param {Strategy} strategy
   * @param {Object} transports
   * @param {Object} options
   */
  function LastSuccessfulStrategy(strategy, transports, options) {
    this.strategy = strategy;
    this.transports = transports;
    this.ttl = options.ttl || 1800*1000;
  }
  var prototype = LastSuccessfulStrategy.prototype;

  prototype.isSupported = function() {
    return this.strategy.isSupported();
  };

  prototype.connect = function(callback) {
    var info = fetchTransportInfo();

    var strategies = [this.strategy];
    if (info && info.timestamp + this.ttl >= Pusher.Util.now()) {
      var transport = this.transports[info.transport];
      if (transport && transport.isSupported()) {
        strategies.push(new Pusher.SequentialStrategy([transport], {
          timeout: info.latency * 2,
          failFast: true
        }));
      }
    }

    var startTimestamp = Pusher.Util.now();
    var runner = strategies.pop().connect(function cb(error, connection) {
      if (error) {
        flushTransportInfo();
        if (strategies.length > 0) {
          startTimestamp = Pusher.Util.now();
          runner = strategies.pop().connect(cb);
        } else {
          callback(error);
        }
      } else {
        var latency = Pusher.Util.now() - startTimestamp;
        storeTransportInfo(connection.name, latency);
        callback(null, connection);
      }
    });

    return {
      abort: function() {
        runner.abort();
      }
    };
  };

  function fetchTransportInfo() {
    var storage = Pusher.Util.getLocalStorage();
    if (storage) {
      var info = storage.pusherTransport;
      if (info) {
        return JSON.parse(storage.pusherTransport);
      }
    }
    return null;
  }

  function storeTransportInfo(transport, latency) {
    var storage = Pusher.Util.getLocalStorage();
    if (storage) {
      storage.pusherTransport = JSON.stringify({
        timestamp: Pusher.Util.now(),
        transport: transport,
        latency: latency,
      });
    }
  }

  function flushTransportInfo() {
    var storage = Pusher.Util.getLocalStorage();
    if (storage) {
      delete storage.pusherTransport;
    }
  }

  Pusher.LastSuccessfulStrategy = LastSuccessfulStrategy;
}).call(this);
