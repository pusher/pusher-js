"use strict";
var runtime_1 = require('node/runtime');
var TimelineSender = (function () {
    function TimelineSender(timeline, options) {
        this.timeline = timeline;
        this.options = options || {};
    }
    TimelineSender.prototype.send = function (encrypted, callback) {
        var self = this;
        if (self.timeline.isEmpty()) {
            return;
        }
        self.timeline.send(runtime_1.default.getTimelineTransport(this, encrypted), callback);
    };
    return TimelineSender;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TimelineSender;
//# sourceMappingURL=timeline_sender.js.map