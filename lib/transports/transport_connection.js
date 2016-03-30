"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var util_1 = require('../util');
var Collections = require('../utils/collections');
var dispatcher_1 = require("../events/dispatcher");
var logger_1 = require('../logger');
var dependencies_1 = require('../runtimes/dom/dependencies');
var TransportConnection = (function (_super) {
    __extends(TransportConnection, _super);
    function TransportConnection(hooks, name, priority, key, options) {
        _super.call(this);
        this.hooks = hooks;
        this.name = name;
        this.priority = priority;
        this.key = key;
        this.options = options;
        this.state = "new";
        this.timeline = options.timeline;
        this.activityTimeout = options.activityTimeout;
        this.id = this.timeline.generateUniqueID();
    }
    TransportConnection.prototype.handlesActivityChecks = function () {
        return Boolean(this.hooks.handlesActivityChecks);
    };
    TransportConnection.prototype.supportsPing = function () {
        return Boolean(this.hooks.supportsPing);
    };
    TransportConnection.prototype.initialize = function () {
        var self = this;
        self.timeline.info(self.buildTimelineMessage({
            transport: self.name + (self.options.encrypted ? "s" : "")
        }));
        if (self.hooks.isInitialized()) {
            self.changeState(ConnectionState.INITIALIZED);
        }
        else if (self.hooks.file) {
            self.changeState(ConnectionState.INITIALIZING);
            dependencies_1.Dependencies.load(self.hooks.file, { encrypted: self.options.encrypted }, function (error, callback) {
                if (self.hooks.isInitialized()) {
                    self.changeState(ConnectionState.INITIALIZED);
                    callback(true);
                }
                else {
                    if (error) {
                        self.onError(error);
                    }
                    self.onClose();
                    callback(false);
                }
            });
        }
        else {
            self.onClose();
        }
    };
    TransportConnection.prototype.connect = function () {
        var self = this;
        if (self.socket || self.state !== ConnectionState.INITIALIZED) {
            return false;
        }
        var url = self.hooks.urls.getInitial(self.key, self.options);
        try {
            self.socket = self.hooks.getSocket(url, self.options);
        }
        catch (e) {
            util_1.default.defer(function () {
                self.onError(e);
                self.changeState(ConnectionState.CLOSED);
            });
            return false;
        }
        self.bindListeners();
        logger_1.default.debug("Connecting", { transport: self.name, url: url });
        self.changeState(ConnectionState.CONNECTING);
        return true;
    };
    TransportConnection.prototype.close = function () {
        if (this.socket) {
            this.socket.close();
            return true;
        }
        else {
            return false;
        }
    };
    TransportConnection.prototype.send = function (data) {
        var self = this;
        if (self.state === ConnectionState.OPEN) {
            util_1.default.defer(function () {
                if (self.socket) {
                    self.socket.send(data);
                }
            });
            return true;
        }
        else {
            return false;
        }
    };
    TransportConnection.prototype.ping = function () {
        if (this.state === ConnectionState.OPEN && this.supportsPing()) {
            this.socket.ping();
        }
    };
    TransportConnection.prototype.onOpen = function () {
        if (this.hooks.beforeOpen) {
            this.hooks.beforeOpen(this.socket, this.hooks.urls.getPath(this.key, this.options));
        }
        this.changeState(ConnectionState.OPEN);
        this.socket.onopen = undefined;
    };
    TransportConnection.prototype.onError = function (error) {
        this.emit("error", { type: 'WebSocketError', error: error });
        this.timeline.error(this.buildTimelineMessage({ error: error.toString() }));
    };
    TransportConnection.prototype.onClose = function (closeEvent) {
        if (closeEvent) {
            this.changeState(ConnectionState.CLOSED, {
                code: closeEvent.code,
                reason: closeEvent.reason,
                wasClean: closeEvent.wasClean
            });
        }
        else {
            this.changeState(ConnectionState.CLOSED);
        }
        this.unbindListeners();
        this.socket = undefined;
    };
    TransportConnection.prototype.onMessage = function (message) {
        this.emit("message", message);
    };
    TransportConnection.prototype.onActivity = function () {
        this.emit("activity");
    };
    TransportConnection.prototype.bindListeners = function () {
        var self = this;
        self.socket.onopen = function () {
            self.onOpen();
        };
        self.socket.onerror = function (error) {
            self.onError(error);
        };
        self.socket.onclose = function (closeEvent) {
            self.onClose(closeEvent);
        };
        self.socket.onmessage = function (message) {
            self.onMessage(message);
        };
        if (self.supportsPing()) {
            self.socket.onactivity = function () { self.onActivity(); };
        }
    };
    TransportConnection.prototype.unbindListeners = function () {
        if (this.socket) {
            this.socket.onopen = undefined;
            this.socket.onerror = undefined;
            this.socket.onclose = undefined;
            this.socket.onmessage = undefined;
            if (this.supportsPing()) {
                this.socket.onactivity = undefined;
            }
        }
    };
    TransportConnection.prototype.changeState = function (state, params) {
        this.state = state;
        this.timeline.info(this.buildTimelineMessage({
            state: state,
            params: params
        }));
        this.emit(state, params);
    };
    TransportConnection.prototype.buildTimelineMessage = function (message) {
        return Collections.extend({ cid: this.id }, message);
    };
    return TransportConnection;
}(dispatcher_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TransportConnection;
//# sourceMappingURL=transport_connection.js.map