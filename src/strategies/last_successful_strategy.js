;(function() {
  /** Caches last successful transport and uses it for following attempts.
   *
   * @param {Strategy} strategy
   */
  function LastSuccessfulStrategy(strategy, options) {
    this.strategy = strategy;
    this.options = options;
    this.ttl = this.options.ttl || 1800*1000;
  }
  var prototype = LastSuccessfulStrategy.prototype;

  prototype.name = "last_successful";

  prototype.isSupported = function() {
    return this.strategy.isSupported();
  };

  prototype.connect = function(callback) {
    var info = fetchTransportInfo();

    var strategies = [this.strategy];
    if (info && info.timestamp + this.ttl >= Pusher.Util.now()) {
      var transport = Pusher.StrategyBuilder.build(
        [":def_transport", "strategy", info.scheme.transport, 0, info.scheme],
        this.options
      )
      strategies.push(new Pusher.SequentialStrategy([transport], {
        timeout: info.latency * 2,
        failFast: true
      }));
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
        storeTransportInfo(connection.name, latency, connection.options);
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

  function storeTransportInfo(name, latency, options) {
    var storage = Pusher.Util.getLocalStorage();
    if (storage) {
      storage.pusherTransport = JSON.stringify({
        timestamp: Pusher.Util.now(),
        latency: latency,
        scheme: Pusher.Util.extend(
          { type: "transport", transport: name }, options
        )
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
