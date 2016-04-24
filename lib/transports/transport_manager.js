"use strict";
var factory_1 = require("../utils/factory");
var TransportManager = (function () {
    function TransportManager(options) {
        this.options = options || [];
        this.livesLeft = this.options.lives || Infinity;
    }
    TransportManager.prototype.getAssistant = function (transport) {
        return factory_1.default.createAssistantToTheTransportManager(this, transport, {
            minPingDelay: this.options.minPingDelay,
            maxPingDelay: this.options.maxPingDelay
        });
    };
    TransportManager.prototype.isAlive = function () {
        return this.livesLeft > 0;
    };
    TransportManager.prototype.reportDeath = function () {
        this.livesLeft -= 1;
    };
    return TransportManager;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TransportManager;
//# sourceMappingURL=transport_manager.js.map