(function() {

  function Timeline(session, sendJSONP, options) {
    this.session = session;
    this.sendJSONP = sendJSONP;
    this.events = [];
    this.options = options || {};
    this.sent = 0;
  }

  var prototype = Timeline.prototype;

  prototype.push = function(event) {
    this.events.push(
      Pusher.Util.extend({}, event, { timestamp: Pusher.Util.now() })
    );
    if (this.options.limit && this.events.length > this.options.limit) {
      this.events.shift();
    }
  };

  prototype.isEmpty = function() {
    return this.events.length === 0;
  };

  prototype.send = function(callback) {
    if (!this.sendJSONP) {
      return false;
    }
    var self = this;

    var data = {};
    if (this.sent === 0) {
      data = Pusher.Util.extend({
        key: this.options.key,
        features: this.options.features,
        version: this.options.version
      }, this.options.params || {});
    }
    data.session = this.session;
    data.timeline = this.events;
    Pusher.Util.filterObject(data, function(v) { return v !== undefined; });

    this.events = [];
    this.sendJSONP(data, function(error, result) {
      if (!error) {
        self.sent++;
      }
      callback(error, result);
    });

    return true;
  };

  Pusher.Timeline = Timeline;

}).call(this);
