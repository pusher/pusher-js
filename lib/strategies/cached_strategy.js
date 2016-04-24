"use strict";
var util_1 = require('../util');
var runtime_1 = require('node/runtime');
var sequential_strategy_1 = require('./sequential_strategy');
var CachedStrategy = (function () {
    function CachedStrategy(strategy, transports, options) {
        this.strategy = strategy;
        this.transports = transports;
        this.ttl = options.ttl || 1800 * 1000;
        this.encrypted = options.encrypted;
        this.timeline = options.timeline;
    }
    CachedStrategy.prototype.isSupported = function () {
        return this.strategy.isSupported();
    };
    CachedStrategy.prototype.connect = function (minPriority, callback) {
        var encrypted = this.encrypted;
        var info = fetchTransportCache(encrypted);
        var strategies = [this.strategy];
        if (info && info.timestamp + this.ttl >= util_1.default.now()) {
            var transport = this.transports[info.transport];
            if (transport) {
                this.timeline.info({
                    cached: true,
                    transport: info.transport,
                    latency: info.latency
                });
                strategies.push(new sequential_strategy_1.default([transport], {
                    timeout: info.latency * 2 + 1000,
                    failFast: true
                }));
            }
        }
        var startTimestamp = util_1.default.now();
        var runner = strategies.pop().connect(minPriority, function cb(error, handshake) {
            if (error) {
                flushTransportCache(encrypted);
                if (strategies.length > 0) {
                    startTimestamp = util_1.default.now();
                    runner = strategies.pop().connect(minPriority, cb);
                }
                else {
                    callback(error);
                }
            }
            else {
                storeTransportCache(encrypted, handshake.transport.name, util_1.default.now() - startTimestamp);
                callback(null, handshake);
            }
        });
        return {
            abort: function () {
                runner.abort();
            },
            forceMinPriority: function (p) {
                minPriority = p;
                if (runner) {
                    runner.forceMinPriority(p);
                }
            }
        };
    };
    return CachedStrategy;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CachedStrategy;
function getTransportCacheKey(encrypted) {
    return "pusherTransport" + (encrypted ? "Encrypted" : "Unencrypted");
}
function fetchTransportCache(encrypted) {
    var storage = runtime_1.default.getLocalStorage();
    if (storage) {
        try {
            var serializedCache = storage[getTransportCacheKey(encrypted)];
            if (serializedCache) {
                return JSON.parse(serializedCache);
            }
        }
        catch (e) {
            flushTransportCache(encrypted);
        }
    }
    return null;
}
function storeTransportCache(encrypted, transport, latency) {
    var storage = runtime_1.default.getLocalStorage();
    if (storage) {
        try {
            storage[getTransportCacheKey(encrypted)] = JSON.stringify({
                timestamp: util_1.default.now(),
                transport: transport,
                latency: latency
            });
        }
        catch (e) {
        }
    }
}
function flushTransportCache(encrypted) {
    var storage = runtime_1.default.getLocalStorage();
    if (storage) {
        try {
            delete storage[getTransportCacheKey(encrypted)];
        }
        catch (e) {
        }
    }
}
//# sourceMappingURL=cached_strategy.js.map