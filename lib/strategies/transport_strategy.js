"use strict";
var factory_1 = require("../utils/factory");
var util_1 = require('../util');
var Errors = require('../errors');
var TransportStrategy = (function () {
    function TransportStrategy(name, priority, transport, options) {
        this.name = name;
        this.priority = priority;
        this.transport = transport;
        this.options = options || {};
    }
    TransportStrategy.prototype.isSupported = function () {
        return this.transport.isSupported({
            encrypted: this.options.encrypted
        });
    };
    TransportStrategy.prototype.connect = function (minPriority, callback) {
        if (!this.isSupported()) {
            return failAttempt(new Errors.UnsupportedStrategy(), callback);
        }
        else if (this.priority < minPriority) {
            return failAttempt(new Errors.TransportPriorityTooLow(), callback);
        }
        var self = this;
        var connected = false;
        var transport = this.transport.createConnection(this.name, this.priority, this.options.key, this.options);
        var handshake = null;
        var onInitialized = function () {
            transport.unbind("initialized", onInitialized);
            transport.connect();
        };
        var onOpen = function () {
            handshake = factory_1.default.createHandshake(transport, function (result) {
                connected = true;
                unbindListeners();
                callback(null, result);
            });
        };
        var onError = function (error) {
            unbindListeners();
            callback(error);
        };
        var onClosed = function () {
            unbindListeners();
            callback(new Errors.TransportClosed(JSON.stringify(transport)));
        };
        var unbindListeners = function () {
            transport.unbind("initialized", onInitialized);
            transport.unbind("open", onOpen);
            transport.unbind("error", onError);
            transport.unbind("closed", onClosed);
        };
        transport.bind("initialized", onInitialized);
        transport.bind("open", onOpen);
        transport.bind("error", onError);
        transport.bind("closed", onClosed);
        transport.initialize();
        return {
            abort: function () {
                if (connected) {
                    return;
                }
                unbindListeners();
                if (handshake) {
                    handshake.close();
                }
                else {
                    transport.close();
                }
            },
            forceMinPriority: function (p) {
                if (connected) {
                    return;
                }
                if (self.priority < p) {
                    if (handshake) {
                        handshake.close();
                    }
                    else {
                        transport.close();
                    }
                }
            }
        };
    };
    return TransportStrategy;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TransportStrategy;
function failAttempt(error, callback) {
    util_1.default.defer(function () {
        callback(error);
    });
    return {
        abort: function () { },
        forceMinPriority: function () { }
    };
}
//# sourceMappingURL=transport_strategy.js.map