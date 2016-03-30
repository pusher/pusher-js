"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var dispatcher_1 = require('../events/dispatcher');
var Errors = require('../errors');
var logger_1 = require('../logger');
var Channel = (function (_super) {
    __extends(Channel, _super);
    function Channel(name, pusher) {
        _super.call(this, function (event, data) {
            logger_1.default.debug('No callbacks on ' + name + ' for ' + event);
        });
        this.name = name;
        this.pusher = pusher;
        this.subscribed = false;
    }
    Channel.prototype.authorize = function (socketId, callback) {
        return callback(false, {});
    };
    Channel.prototype.trigger = function (event, data) {
        if (event.indexOf("client-") !== 0) {
            throw new Errors.BadEventName("Event '" + event + "' does not start with 'client-'");
        }
        return this.pusher.send_event(event, data, this.name);
    };
    Channel.prototype.disconnect = function () {
        this.subscribed = false;
    };
    Channel.prototype.handleEvent = function (event, data) {
        if (event.indexOf("pusher_internal:") === 0) {
            if (event === "pusher_internal:subscription_succeeded") {
                this.subscribed = true;
                this.emit("pusher:subscription_succeeded", data);
            }
        }
        else {
            this.emit(event, data);
        }
    };
    Channel.prototype.subscribe = function () {
        var _this = this;
        this.authorize(this.pusher.connection.socket_id, function (error, data) {
            if (error) {
                _this.handleEvent('pusher:subscription_error', data);
            }
            else {
                _this.pusher.send_event('pusher:subscribe', {
                    auth: data.auth,
                    channel_data: data.channel_data,
                    channel: _this.name
                });
            }
        });
    };
    Channel.prototype.unsubscribe = function () {
        this.pusher.send_event('pusher:unsubscribe', {
            channel: this.name
        });
    };
    return Channel;
}(dispatcher_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Channel;
//# sourceMappingURL=channel.js.map