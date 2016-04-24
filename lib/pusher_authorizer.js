"use strict";
var runtime_1 = require('node/runtime');
var Authorizer = (function () {
    function Authorizer(channel, options) {
        this.channel = channel;
        this.type = options.authTransport;
        this.options = options;
        this.authOptions = (options || {}).auth || {};
    }
    Authorizer.prototype.composeQuery = function (socketId) {
        var query = 'socket_id=' + encodeURIComponent(socketId) +
            '&channel_name=' + encodeURIComponent(this.channel.name);
        for (var i in this.authOptions.params) {
            query += "&" + encodeURIComponent(i) + "=" + encodeURIComponent(this.authOptions.params[i]);
        }
        return query;
    };
    Authorizer.prototype.authorize = function (socketId, callback) {
        Authorizer.authorizers = Authorizer.authorizers || runtime_1.default.getAuthorizers();
        return Authorizer.authorizers[this.type].call(this, runtime_1.default, socketId, callback);
    };
    return Authorizer;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Authorizer;
//# sourceMappingURL=pusher_authorizer.js.map