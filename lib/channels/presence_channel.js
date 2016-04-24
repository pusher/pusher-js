"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var private_channel_1 = require('./private_channel');
var logger_1 = require('../logger');
var members_1 = require('./members');
var PresenceChannel = (function (_super) {
    __extends(PresenceChannel, _super);
    function PresenceChannel(name, pusher) {
        _super.call(this, name, pusher);
        this.members = new members_1.default();
    }
    PresenceChannel.prototype.authorize = function (socketId, callback) {
        var self = this;
        _super.prototype.authorize.call(this, socketId, function (error, authData) {
            if (!error) {
                if (authData.channel_data === undefined) {
                    logger_1.default.warn("Invalid auth response for channel '" +
                        self.name +
                        "', expected 'channel_data' field");
                    callback("Invalid auth response");
                    return;
                }
                var channelData = JSON.parse(authData.channel_data);
                self.members.setMyID(channelData.user_id);
            }
            callback(error, authData);
        });
    };
    PresenceChannel.prototype.handleEvent = function (event, data) {
        switch (event) {
            case "pusher_internal:subscription_succeeded":
                this.members.onSubscription(data);
                this.subscribed = true;
                this.emit("pusher:subscription_succeeded", this.members);
                break;
            case "pusher_internal:member_added":
                var addedMember = this.members.addMember(data);
                this.emit('pusher:member_added', addedMember);
                break;
            case "pusher_internal:member_removed":
                var removedMember = this.members.removeMember(data);
                if (removedMember) {
                    this.emit('pusher:member_removed', removedMember);
                }
                break;
            default:
                private_channel_1.default.prototype.handleEvent.call(this, event, data);
        }
    };
    PresenceChannel.prototype.disconnect = function () {
        this.members.reset();
        _super.prototype.disconnect.call(this);
    };
    return PresenceChannel;
}(private_channel_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PresenceChannel;
//# sourceMappingURL=presence_channel.js.map