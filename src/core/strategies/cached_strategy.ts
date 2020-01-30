import Util from '../util';
import Runtime from 'runtime';
import Strategy from './strategy';
import SequentialStrategy from './sequential_strategy';
import StrategyOptions from './strategy_options';
import TransportStrategy from './transport_strategy';
import Timeline from '../timeline/timeline';
import * as Collections from '../utils/collections';

export interface TransportStrategyDictionary {
  [key: string]: TransportStrategy;
}

/** Caches last successful transport and uses it for following attempts.
 *
 * @param {Strategy} strategy
 * @param {Object} transports
 * @param {Object} options
 */
export default class CachedStrategy implements Strategy {
  strategy: Strategy;
  transports: TransportStrategyDictionary;
  ttl: number;
  usingTLS: boolean;
  timeline: Timeline;

  constructor(
    strategy: Strategy,
    transports: TransportStrategyDictionary,
    options: StrategyOptions
  ) {
    this.strategy = strategy;
    this.transports = transports;
    this.ttl = options.ttl || 1800 * 1000;
    this.usingTLS = options.useTLS;
    this.timeline = options.timeline;
  }

  isSupported(): boolean {
    return this.strategy.isSupported();
  }

  connect(minPriority: number, callback: Function) {
    var usingTLS = this.usingTLS;
    var info = fetchTransportCache(usingTLS);

    var strategies = [this.strategy];
    if (info && info.timestamp + this.ttl >= Util.now()) {
      var transport = this.transports[info.transport];
      if (transport) {
        this.timeline.info({
          cached: true,
          transport: info.transport,
          latency: info.latency
        });
        strategies.push(
          new SequentialStrategy([transport], {
            timeout: info.latency * 2 + 1000,
            failFast: true
          })
        );
      }
    }

    var startTimestamp = Util.now();
    var runner = strategies
      .pop()
      .connect(minPriority, function cb(error, handshake) {
        if (error) {
          flushTransportCache(usingTLS);
          if (strategies.length > 0) {
            startTimestamp = Util.now();
            runner = strategies.pop().connect(minPriority, cb);
          } else {
            callback(error);
          }
        } else {
          storeTransportCache(
            usingTLS,
            handshake.transport.name,
            Util.now() - startTimestamp
          );
          callback(null, handshake);
        }
      });

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
  }
}

function getTransportCacheKey(usingTLS: boolean): string {
  return 'pusherTransport' + (usingTLS ? 'TLS' : 'NonTLS');
}

function fetchTransportCache(usingTLS: boolean): any {
  var storage = Runtime.getLocalStorage();
  if (storage) {
    try {
      var serializedCache = storage[getTransportCacheKey(usingTLS)];
      if (serializedCache) {
        return JSON.parse(serializedCache);
      }
    } catch (e) {
      flushTransportCache(usingTLS);
    }
  }
  return null;
}

function storeTransportCache(
  usingTLS: boolean,
  transport: TransportStrategy,
  latency: number
) {
  var storage = Runtime.getLocalStorage();
  if (storage) {
    try {
      storage[getTransportCacheKey(usingTLS)] = Collections.safeJSONStringify({
        timestamp: Util.now(),
        transport: transport,
        latency: latency
      });
    } catch (e) {
      // catch over quota exceptions raised by localStorage
    }
  }
}

function flushTransportCache(usingTLS: boolean) {
  var storage = Runtime.getLocalStorage();
  if (storage) {
    try {
      delete storage[getTransportCacheKey(usingTLS)];
    } catch (e) {
      // catch exceptions raised by localStorage
    }
  }
}
