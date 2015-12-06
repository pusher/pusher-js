var Util = require('../util');

function TimelineSender(timeline, options) {
  this.timeline = timeline;
  this.options = options || {};
}
var prototype = TimelineSender.prototype;

prototype.send = function(encrypted, callback) {
  var self = this;

  if (self.timeline.isEmpty()) {
    return;
  }

  var sendXHR = function(data, callback) {
    var scheme = "http" + (encrypted ? "s" : "") + "://";
    var url = scheme + (self.host || self.options.host) + self.options.path;
    // UNFINISHED
  };
  self.timeline.send(sendXHR, callback);
};

module.exports = TimelineSender;
