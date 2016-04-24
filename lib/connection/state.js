"use strict";
var ConnectionState;
(function (ConnectionState) {
    ConnectionState[ConnectionState["const"] = OPEN = "open"] = "const";
    ConnectionState[ConnectionState["CLOSED"] = "closed"] = "CLOSED";
    ConnectionState[ConnectionState["NEW"] = "new"] = "NEW";
    ConnectionState[ConnectionState["INITIALIZED"] = "initialized"] = "INITIALIZED";
    ConnectionState[ConnectionState["INITIALIZING"] = "initializing"] = "INITIALIZING";
    ConnectionState[ConnectionState["CONNECTING"] = "connecting"] = "CONNECTING";
    ConnectionState[ConnectionState["FAILED"] = "failed"] = "FAILED";
    ConnectionState[ConnectionState["DISCONNECTED"] = "disconnected"] = "DISCONNECTED";
    ConnectionState[ConnectionState["UNAVAILABLE"] = "unavailable"] = "UNAVAILABLE";
    ConnectionState[ConnectionState["CONNECTED"] = "connected"] = "CONNECTED";
})(ConnectionState || (ConnectionState = {}));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ConnectionState;
//# sourceMappingURL=state.js.map