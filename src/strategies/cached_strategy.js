var Util = require('../util');
var SequentialStrategy = require('./sequential_strategy');

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
  this.encrypted = options.encrypted;
  this.timeline = options.timeline;
}
var prototype = CachedStrategy.prototype;

prototype.isSupported = function() {
  return this.strategy.isSupported();
};

prototype.connect = function(minPriority, callback) {
  var encrypted = this.encrypted;
  var info = fetchTransportCache(encrypted);

  var strategies = [this.strategy];
  if (info && info.timestamp + this.ttl >= Util.now()) {
    var transport = this.transports[info.transport];
    if (transport) {
      this.timeline.info({
        cached: true,
        transport: info.transport,
        latency: info.latency
      });
      strategies.push(new SequentialStrategy([transport], {
        timeout: info.latency * 2 + 1000,
        failFast: true
      }));
    }
  }

  var startTimestamp = Util.now();
  var runner = strategies.pop().connect(
    minPriority,
    function cb(error, handshake) {
      if (error) {
        flushTransportCache(encrypted);
        if (strategies.length > 0) {
          startTimestamp = Util.now();
          runner = strategies.pop().connect(minPriority, cb);
        } else {
          callback(error);
        }
      } else {
        storeTransportCache(
          encrypted,
          handshake.transport.name,
          Util.now() - startTimestamp
        );
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

function getTransportCacheKey(encrypted) {
  return "pusherTransport" + (encrypted ? "Encrypted" : "Unencrypted");
}

function fetchTransportCache(encrypted) {
  var storage = Util.getLocalStorage();
  if (storage) {
    try {
      var serializedCache = storage[getTransportCacheKey(encrypted)];
      if (serializedCache) {
        return JSON.parse(serializedCache);
      }
    } catch (e) {
      flushTransportCache(encrypted);
    }
  }
  return null;
}

function storeTransportCache(encrypted, transport, latency) {
  var storage = Util.getLocalStorage();
  if (storage) {
    try {
      storage[getTransportCacheKey(encrypted)] = JSON.stringify({
        timestamp: Util.now(),
        transport: transport,
        latency: latency
      });
    } catch (e) {
      // catch over quota exceptions raised by localStorage
    }
  }
}

function flushTransportCache(encrypted) {
  var storage = Util.getLocalStorage();
  if (storage) {
    try {
      delete storage[getTransportCacheKey(encrypted)];
    } catch (e) {
      // catch exceptions raised by localStorage
    }
  }
}

module.exports = CachedStrategy;
