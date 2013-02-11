(function() {
  function TimelineSender(timeline, options) {
    this.timeline = timeline;
    this.options = options || {};
  }
  var prototype = TimelineSender.prototype;

  prototype.send = function(callback) {
    if (this.timeline.isEmpty()) {
      return;
    }

    var options = this.options;
    var scheme = "http" + (this.isEncrypted() ? "s" : "") + "://";

    var sendJSONP = function(data, callback) {
      return Pusher.JSONPRequest.send({
        data: data,
        url: scheme + options.host + options.path,
        receiver: Pusher.JSONP
      }, callback);
    };
    this.timeline.send(sendJSONP, callback);
  };

  prototype.isEncrypted = function() {
    return !!this.options.encrypted;
  };

  Pusher.TimelineSender = TimelineSender;
}).call(this);
