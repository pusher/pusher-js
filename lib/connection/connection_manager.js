"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var dispatcher_1 = require('../events/dispatcher');
var timers_1 = require('../utils/timers');
var net_info_1 = require('node/net_info');
var logger_1 = require('../logger');
var state_1 = require('./state');
var Collections = require("../utils/collections");
var ConnectionManager = (function (_super) {
    __extends(ConnectionManager, _super);
    function ConnectionManager(key, options) {
        _super.call(this);
        this.key = key;
        this.options = options || {};
        this.state = state_1.default.INITIALIZED;
        this.connection = null;
        this.encrypted = !!options.encrypted;
        this.timeline = this.options.timeline;
        this.connectionCallbacks = this.buildConnectionCallbacks();
        this.errorCallbacks = this.buildErrorCallbacks();
        this.handshakeCallbacks = this.buildHandshakeCallbacks(this.errorCallbacks);
        var self = this;
        net_info_1.Network.bind("online", function () {
            self.timeline.info({ netinfo: "online" });
            if ((self.state) === "connecting" || (self.state) === "unavailable") {
                self.retryIn(0);
            }
        });
        net_info_1.Network.bind("offline", function () {
            self.timeline.info({ netinfo: "offline" });
            if (self.connection) {
                self.sendActivityCheck();
            }
        });
        this.updateStrategy();
    }
    ConnectionManager.prototype.connect = function () {
        if (this.connection || this.runner) {
            return;
        }
        if (!this.strategy.isSupported()) {
            this.updateState(state_1.default.FAILED);
            return;
        }
        this.updateState(state_1.default.CONNECTING);
        this.startConnecting();
        this.setUnavailableTimer();
    };
    ;
    ConnectionManager.prototype.send = function (data) {
        if (this.connection) {
            return this.connection.send(data);
        }
        else {
            return false;
        }
    };
    ;
    ConnectionManager.prototype.send_event = function (name, data, channel) {
        if (this.connection) {
            return this.connection.send_event(name, data, channel);
        }
        else {
            return false;
        }
    };
    ;
    ConnectionManager.prototype.disconnect = function () {
        this.disconnectInternally();
        this.updateState(state_1.default.DISCONNECTED);
    };
    ;
    ConnectionManager.prototype.isEncrypted = function () {
        return this.encrypted;
    };
    ;
    ConnectionManager.prototype.startConnecting = function () {
        var self = this;
        var callback = function (error, handshake) {
            if (error) {
                self.runner = self.strategy.connect(0, callback);
            }
            else {
                if (handshake.action === "error") {
                    self.emit("error", { type: "HandshakeError", error: handshake.error });
                    self.timeline.error({ handshakeError: handshake.error });
                }
                else {
                    self.abortConnecting();
                    self.handshakeCallbacks[handshake.action](handshake);
                }
            }
        };
        self.runner = self.strategy.connect(0, callback);
    };
    ;
    ConnectionManager.prototype.abortConnecting = function () {
        if (this.runner) {
            this.runner.abort();
            this.runner = null;
        }
    };
    ;
    ConnectionManager.prototype.disconnectInternally = function () {
        this.abortConnecting();
        this.clearRetryTimer();
        this.clearUnavailableTimer();
        if (this.connection) {
            var connection = this.abandonConnection();
            connection.close();
        }
    };
    ;
    ConnectionManager.prototype.updateStrategy = function () {
        this.strategy = this.options.getStrategy({
            key: this.key,
            timeline: this.timeline,
            encrypted: this.encrypted
        });
    };
    ;
    ConnectionManager.prototype.retryIn = function (delay) {
        var self = this;
        self.timeline.info({ action: "retry", delay: delay });
        if (delay > 0) {
            self.emit("connecting_in", Math.round(delay / 1000));
        }
        self.retryTimer = new timers_1.OneOffTimer(delay || 0, function () {
            self.disconnectInternally();
            self.connect();
        });
    };
    ;
    ConnectionManager.prototype.clearRetryTimer = function () {
        if (this.retryTimer) {
            this.retryTimer.ensureAborted();
            this.retryTimer = null;
        }
    };
    ;
    ConnectionManager.prototype.setUnavailableTimer = function () {
        var self = this;
        self.unavailableTimer = new timers_1.OneOffTimer(self.options.unavailableTimeout, function () {
            self.updateState(state_1.default.UNAVAILABLE);
        });
    };
    ;
    ConnectionManager.prototype.clearUnavailableTimer = function () {
        if (this.unavailableTimer) {
            this.unavailableTimer.ensureAborted();
        }
    };
    ;
    ConnectionManager.prototype.sendActivityCheck = function () {
        var self = this;
        self.stopActivityCheck();
        self.connection.ping();
        self.activityTimer = new timers_1.OneOffTimer(self.options.pongTimeout, function () {
            self.timeline.error({ pong_timed_out: self.options.pongTimeout });
            self.retryIn(0);
        });
    };
    ;
    ConnectionManager.prototype.resetActivityCheck = function () {
        var self = this;
        self.stopActivityCheck();
        if (!self.connection.handlesActivityChecks()) {
            self.activityTimer = new timers_1.OneOffTimer(self.activityTimeout, function () {
                self.sendActivityCheck();
            });
        }
    };
    ;
    ConnectionManager.prototype.stopActivityCheck = function () {
        if (this.activityTimer) {
            this.activityTimer.ensureAborted();
        }
    };
    ;
    ConnectionManager.prototype.buildConnectionCallbacks = function () {
        var self = this;
        return {
            message: function (message) {
                self.resetActivityCheck();
                self.emit('message', message);
            },
            ping: function () {
                self.send_event('pusher:pong', {});
            },
            activity: function () {
                self.resetActivityCheck();
            },
            error: function (error) {
                self.emit("error", { type: "WebSocketError", error: error });
            },
            closed: function () {
                self.abandonConnection();
                if (self.shouldRetry()) {
                    self.retryIn(1000);
                }
            }
        };
    };
    ;
    ConnectionManager.prototype.buildHandshakeCallbacks = function (errorCallbacks) {
        var self = this;
        return Collections.extend({}, errorCallbacks, {
            connected: function (handshake) {
                self.activityTimeout = Math.min(self.options.activityTimeout, handshake.activityTimeout, handshake.connection.activityTimeout || Infinity);
                self.clearUnavailableTimer();
                self.setConnection(handshake.connection);
                self.socket_id = self.connection.id;
                self.updateState(state_1.default.CONNECTED, { socket_id: self.socket_id });
            }
        });
    };
    ;
    ConnectionManager.prototype.buildErrorCallbacks = function () {
        var self = this;
        function withErrorEmitted(callback) {
            return function (result) {
                if (result.error) {
                    self.emit("error", { type: "WebSocketError", error: result.error });
                }
                callback(result);
            };
        }
        return {
            ssl_only: withErrorEmitted(function () {
                self.encrypted = true;
                self.updateStrategy();
                self.retryIn(0);
            }),
            refused: withErrorEmitted(function () {
                self.disconnect();
            }),
            backoff: withErrorEmitted(function () {
                self.retryIn(1000);
            }),
            retry: withErrorEmitted(function () {
                self.retryIn(0);
            })
        };
    };
    ;
    ConnectionManager.prototype.setConnection = function (connection) {
        this.connection = connection;
        for (var event in this.connectionCallbacks) {
            this.connection.bind(event, this.connectionCallbacks[event]);
        }
        this.resetActivityCheck();
    };
    ;
    ConnectionManager.prototype.abandonConnection = function () {
        if (!this.connection) {
            return;
        }
        this.stopActivityCheck();
        for (var event in this.connectionCallbacks) {
            this.connection.unbind(event, this.connectionCallbacks[event]);
        }
        var connection = this.connection;
        this.connection = null;
        return connection;
    };
    ConnectionManager.prototype.updateState = function (newState, data) {
        var previousState = this.state;
        this.state = newState;
        if (previousState !== newState) {
            var newStateDescription = newState;
            if (newStateDescription === "connected") {
                newStateDescription += " with new socket ID " + data.socket_id;
            }
            logger_1.default.debug('State changed', previousState + ' -> ' + newStateDescription);
            this.timeline.info({ state: newState, params: data });
            this.emit('state_change', { previous: previousState, current: newState });
            this.emit(newState, data);
        }
    };
    ConnectionManager.prototype.shouldRetry = function () {
        return (this.state) === "connecting" || (this.state) === "connected";
    };
    return ConnectionManager;
}(dispatcher_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ConnectionManager;
//# sourceMappingURL=connection_manager.js.map