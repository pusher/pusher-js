var Util = require('../util');
var Base64 = require('../base64');

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
    var params = Util.filterObject(data, function(value) {
      return value !== undefined;
    });

    var query = Util.map(
      Util.flatten(encodeParamsObject(params)),
      Util.method("join", "=")
    ).join("&");

    url += ("/" + 2 + "?" + query); // TODO: check what to do in lieu of receiver number

    var xhr = Util.createXHR();
    xhr.open("GET", url, true);

    xhr.onreadystatechange = function(){
      if (xhr.readyState === 4) {
        // TODO: handle response
      }
    }

    xhr.send()
  };
  self.timeline.send(sendXHR, callback);
};

function encodeParamsObject(data) {
  return Util.mapObject(data, function(value) {
    if (typeof value === "object") {
      value = JSON.stringify(value);
    }
    return encodeURIComponent(Base64.encode(value.toString()));
  });
}

module.exports = TimelineSender;
