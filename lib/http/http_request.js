"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var App = require("pusher-websocket-iso-externals-node/app");
var dispatcher_1 = require("../events/dispatcher");
var MAX_BUFFER_LENGTH = 256 * 1024;
var HTTPRequest = (function (_super) {
    __extends(HTTPRequest, _super);
    function HTTPRequest(hooks, method, url) {
        _super.call(this);
        this.hooks = hooks;
        this.method = method;
        this.url = url;
    }
    HTTPRequest.prototype.start = function (payload) {
        var self = this;
        self.position = 0;
        self.xhr = self.hooks.getRequest(self);
        self.unloader = function () {
            self.close();
        };
        App.addUnloadListener(self.unloader);
        self.xhr.open(self.method, self.url, true);
        self.xhr.send(payload);
    };
    HTTPRequest.prototype.close = function () {
        if (this.unloader) {
            App.removeUnloadListener(this.unloader);
            this.unloader = null;
        }
        if (this.xhr) {
            this.hooks.abortRequest(this.xhr);
            this.xhr = null;
        }
    };
    HTTPRequest.prototype.onChunk = function (status, data) {
        while (true) {
            var chunk = this.advanceBuffer(data);
            if (chunk) {
                this.emit("chunk", { status: status, data: chunk });
            }
            else {
                break;
            }
        }
        if (this.isBufferTooLong(data)) {
            this.emit("buffer_too_long");
        }
    };
    HTTPRequest.prototype.advanceBuffer = function (buffer) {
        var unreadData = buffer.slice(this.position);
        var endOfLinePosition = unreadData.indexOf("\n");
        if (endOfLinePosition !== -1) {
            this.position += endOfLinePosition + 1;
            return unreadData.slice(0, endOfLinePosition);
        }
        else {
            return null;
        }
    };
    HTTPRequest.prototype.isBufferTooLong = function (buffer) {
        return this.position === buffer.length && buffer.length > MAX_BUFFER_LENGTH;
    };
    return HTTPRequest;
}(dispatcher_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HTTPRequest;
//# sourceMappingURL=http_request.js.map