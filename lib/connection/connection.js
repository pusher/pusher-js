"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Collections = require('../utils/collections');
var dispatcher_1 = require('../events/dispatcher');
var Protocol = require('./protocol/protocol');
var logger_1 = require('../logger');
var Connection = (function (_super) {
    __extends(Connection, _super);
    function Connection(id, transport) {
        _super.call(this);
        this.id = id;
        this.transport = transport;
        this.activityTimeout = transport.activityTimeout;
        this.bindListeners();
    }
    Connection.prototype.handlesActivityChecks = function () {
        return this.transport.handlesActivityChecks();
    };
    Connection.prototype.send = function (data) {
        return this.transport.send(data);
    };
    Connection.prototype.send_event = function (name, data, channel) {
        var message = { event: name, data: data };
        if (channel) {
            message.channel = channel;
        }
        logger_1.default.debug('Event sent', message);
        return this.send(Protocol.encodeMessage(message));
    };
    Connection.prototype.ping = function () {
        if (this.transport.supportsPing()) {
            this.transport.ping();
        }
        else {
            this.send_event('pusher:ping', {});
        }
    };
    Connection.prototype.close = function () {
        this.transport.close();
    };
    Connection.prototype.bindListeners = function () {
        var self = this;
        var listeners = {
            message: function (m) {
                var message;
                try {
                    message = Protocol.decodeMessage(m);
                }
                catch (e) {
                    self.emit('error', {
                        type: 'MessageParseError',
                        error: e,
                        data: m.data
                    });
                }
                if (message !== undefined) {
                    logger_1.default.debug('Event recd', message);
                    switch (message.event) {
                        case 'pusher:error':
                            self.emit('error', { type: 'PusherError', data: message.data });
                            break;
                        case 'pusher:ping':
                            self.emit("ping");
                            break;
                        case 'pusher:pong':
                            self.emit("pong");
                            break;
                    }
                    self.emit('message', message);
                }
            },
            activity: function () {
                self.emit("activity");
            },
            error: function (error) {
                self.emit("error", { type: "WebSocketError", error: error });
            },
            closed: function (closeEvent) {
                unbindListeners();
                if (closeEvent && closeEvent.code) {
                    self.handleCloseEvent(closeEvent);
                }
                self.transport = null;
                self.emit("closed");
            }
        };
        var unbindListeners = function () {
            Collections.objectApply(listeners, function (listener, event) {
                self.transport.unbind(event, listener);
            });
        };
        Collections.objectApply(listeners, function (listener, event) {
            self.transport.bind(event, listener);
        });
    };
    Connection.prototype.handleCloseEvent = function (closeEvent) {
        var action = Protocol.getCloseAction(closeEvent);
        var error = Protocol.getCloseError(closeEvent);
        if (error) {
            this.emit('error', error);
        }
        if (action) {
            this.emit(action);
        }
    };
    return Connection;
}(dispatcher_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Connection;
//# sourceMappingURL=connection.js.map