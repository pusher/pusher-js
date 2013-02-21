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

    var strategy = this.strategy;
    if (info && info.timestamp + this.ttl >= Pusher.Util.now()) {
      strategy = Pusher.StrategyBuilder.build(
        Pusher.Util.extend({}, this.options, info.scheme)
      );
    }

    return strategy.connect(function(error, connection) {
      if (error) {
        flushTransportInfo();
      } else {
        storeTransportInfo(connection.name, connection.options);
      }
      callback(error, connection);
    });
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

  function storeTransportInfo(name, options) {
    var storage = Pusher.Util.getLocalStorage();
    if (storage) {
      storage.pusherTransport = JSON.stringify({
        timestamp: Pusher.Util.now(),
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
