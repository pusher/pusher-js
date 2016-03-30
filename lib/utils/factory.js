"use strict";
var assistant_to_the_transport_manager_1 = require("../transports/assistant_to_the_transport_manager");
var handshake_1 = require("../connection/handshake");
var pusher_authorizer_1 = require("../pusher_authorizer");
var timeline_sender_1 = require("../timeline/timeline_sender");
var presence_channel_1 = require("../channels/presence_channel");
var private_channel_1 = require("../channels/private_channel");
var channel_1 = require("../channels/channel");
var connection_manager_1 = require("../connection/connection_manager");
var xhr_1 = require("node/xhr");
var channels_1 = require("../channels/channels");
var net_info_1 = require("node/net_info");
var ws_1 = require('node/ws');
var Factory = {
    createXHR: function () {
        if (xhr_1.default.getAPI()) {
            return this.createXMLHttpRequest();
        }
        else {
            return this.createMicrosoftXHR();
        }
    },
    createXMLHttpRequest: function () {
        var Constructor = xhr_1.default.getAPI();
        return new Constructor();
    },
    createMicrosoftXHR: function () {
        return new ActiveXObject("Microsoft.XMLHTTP");
    },
    createChannels: function () {
        return new channels_1.default();
    },
    createConnectionManager: function (key, options) {
        return new connection_manager_1.default(key, options);
    },
    createChannel: function (name, pusher) {
        return new channel_1.default(name, pusher);
    },
    createPrivateChannel: function (name, pusher) {
        return new private_channel_1.default(name, pusher);
    },
    createPresenceChannel: function (name, pusher) {
        return new presence_channel_1.default(name, pusher);
    },
    createTimelineSender: function (timeline, options) {
        return new timeline_sender_1.default(timeline, options);
    },
    createAuthorizer: function (channel, options) {
        return new pusher_authorizer_1.default(channel, options);
    },
    createHandshake: function (transport, callback) {
        return new handshake_1.default(transport, callback);
    },
    getNetwork: function () {
        return net_info_1.Network;
    },
    createWebSocket: function (url) {
        var Constructor = ws_1.default.getAPI();
        return new Constructor(url);
    },
    createAssistantToTheTransportManager: function (manager, transport, options) {
        return new assistant_to_the_transport_manager_1.default(manager, transport, options);
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Factory;
//# sourceMappingURL=factory.js.map