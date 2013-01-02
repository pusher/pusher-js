(function() {

  function Timeline(session, jsonp, options) {
    this.session = session;
    this.jsonp = jsonp;
    this.events = [];
    this.options = options || {};
  }

  var prototype = Timeline.prototype;

  prototype.push = function(event) {
    this.events.push(Pusher.Util.extend({}, event, { timestamp: Date.now() }));
    if (this.options.limit && this.events.length > this.options.limit) {
      this.events.shift();
    }
  };

  prototype.send = function(callback) {
    if (!this.jsonp) {
      return false;
    }

    var data = Pusher.Util.filterObject({
      session: this.session,
      features: this.options.features,
      version: this.options.version,
      timeline: this.events
    }, function(v) { return v !== undefined; });

    this.events = [];
    this.jsonp.send(data, callback);

    return true;
  };

  Pusher.Timeline = Timeline;

}).call(this);
