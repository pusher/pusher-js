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

    var options = this.options;
    var scheme = "http" + (encrypted ? "s" : "") + "://";

    var sendJSONP = function(data, callback) {
      var params = {
        data: data,
        url: scheme + options.host + options.path,
        receiver: Pusher.JSONP
      };
      return Pusher.JSONPRequest.send(params, function(error, result) {
        callback(error, result);
      });
    };
    this.timeline.send(sendJSONP, callback);
  };

  Pusher.TimelineSender = TimelineSender;
}).call(this);
