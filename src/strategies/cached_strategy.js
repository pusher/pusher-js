;(function() {
  /** Caches last successful transport and uses it for following attempts.
   *
   * @param {Strategy} strategy
   * @param {Object} transports
   * @param {Object} options
   */
  function CachedStrategy(strategy, transports, options) {
    this.strategy = strategy;
    this.transports = transports;
    this.ttl = options.ttl || 1800*1000;
    this.timeline = options.timeline;
  }
  var prototype = CachedStrategy.prototype;

  prototype.isSupported = function() {
    return this.strategy.isSupported();
  };

  prototype.connect = function(minPriority, callback) {
    var info = fetchTransportInfo();

    var strategies = [this.strategy];
    if (info && info.timestamp + this.ttl >= Pusher.Util.now()) {
      var transport = this.transports[info.transport];
      if (transport) {
        this.timeline.info({
          cached: true,
          transport: info.transport,
          latency: info.latency
        });
        strategies.push(new Pusher.SequentialStrategy([transport], {
          timeout: info.latency * 2,
          failFast: true
        }));
      }
    }

    var startTimestamp = Pusher.Util.now();
    var runner = strategies.pop().connect(
      minPriority,
      function cb(error, handshake) {
        if (error) {
          flushTransportInfo();
          if (strategies.length > 0) {
            startTimestamp = Pusher.Util.now();
            runner = strategies.pop().connect(minPriority, cb);
          } else {
            callback(error);
          }
        } else {
          var latency = Pusher.Util.now() - startTimestamp;
          storeTransportInfo(handshake.transport.name, latency);
          callback(null, handshake);
        }
      }
    );

    return {
      abort: function() {
        runner.abort();
      },
      forceMinPriority: function(p) {
        minPriority = p;
        if (runner) {
          runner.forceMinPriority(p);
        }
      }
    };
  };

  function fetchTransportInfo() {
    var storage = Pusher.Util.getLocalStorage();
    if (storage) {
      try {
        var info = storage.pusherTransport;
        if (info) {
          return JSON.parse(info);
        }
      } catch (e) {
        flushTransportInfo();
      }
    }
    return null;
  }

  function storeTransportInfo(transport, latency) {
    var storage = Pusher.Util.getLocalStorage();
    if (storage) {
      try {
        storage.pusherTransport = JSON.stringify({
          timestamp: Pusher.Util.now(),
          transport: transport,
          latency: latency
        });
      } catch (e) {
        // catch over quota exceptions raised by localStorage
      }
    }
  }

  function flushTransportInfo() {
    var storage = Pusher.Util.getLocalStorage();
    if (storage && storage.pusherTransport) {
      try {
        delete storage.pusherTransport;
      } catch (e) {
        storage.pusherTransport = undefined;
      }
    }
  }

  Pusher.CachedStrategy = CachedStrategy;
}).call(this);
