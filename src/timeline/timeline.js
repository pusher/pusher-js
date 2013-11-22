(function() {
  function Timeline(key, session, options) {
    this.key = key;
    this.session = session;
    this.events = [];
    this.options = options || {};
    this.sent = 0;
    this.uniqueID = 0;
  }
  var prototype = Timeline.prototype;

  // Log levels
  Timeline.ERROR = 3;
  Timeline.INFO = 6;
  Timeline.DEBUG = 7;

  prototype.log = function(level, event) {
    if (this.options.level === undefined || level <= this.options.level) {
      this.events.push(
        Pusher.Util.extend({}, event, {
          timestamp: Pusher.Util.now(),
          level: (level !== Timeline.INFO ? level : undefined)
        })
      );
      if (this.options.limit && this.events.length > this.options.limit) {
        this.events.shift();
      }
    }
  };

  prototype.error = function(event) {
    this.log(Timeline.ERROR, event);
  };

  prototype.info = function(event) {
    this.log(Timeline.INFO, event);
  };

  prototype.debug = function(event) {
    this.log(Timeline.DEBUG, event);
  };

  prototype.isEmpty = function() {
    return this.events.length === 0;
  };

  prototype.send = function(sendJSONP, callback) {
    var self = this;

    if (Pusher.Network.isOnline() === false) {
      return false;
    }

    var data = {
      session: self.session,
      bundle: self.sent + 1,
      timeline: self.events
    };
    if (self.sent === 0) {
      Pusher.Util.extend(data, {
        key: self.key,
        features: self.options.features,
        lib: "js",
        version: self.options.version
      }, self.options.params || {});
    }
    data = Pusher.Util.filterObject(data, function(v) {
      return v !== undefined;
    });

    self.events = [];
    sendJSONP(data, function(error, result) {
      if (!error) {
        self.sent++;
      }
      if (callback) {
        callback(error, result);
      }
    });

    return true;
  };

  prototype.generateUniqueID = function() {
    this.uniqueID++;
    return this.uniqueID;
  };

  Pusher.Timeline = Timeline;
}).call(this);
