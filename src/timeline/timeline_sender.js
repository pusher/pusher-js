(function() {
  function TimelineSender(timeline, options) {
    this.timeline = timeline;
    this.options = options || {};
  }
  var prototype = TimelineSender.prototype;

  prototype.send = function(encrypted, callback) {
    if (this.timeline.isEmpty()) {
      return;
    }

    var self = this;
    var scheme = "http" + (encrypted ? "s" : "") + "://";

    var sendJSONP = function(data, callback) {
      var params = {
        data: Pusher.Util.filterObject(data, function(v) {
          return v !== undefined;
        }),
        url: scheme + (self.host || self.options.host) + self.options.path,
        receiver: Pusher.JSONP
      };
      return Pusher.JSONPRequest.send(params, function(error, result) {
        if (result && result.host) {
          self.host = result.host;
        }
        if (callback) {
          callback(error, result);
        }
      });
    };
    self.timeline.send(sendJSONP, callback);
  };

  Pusher.TimelineSender = TimelineSender;
}).call(this);
