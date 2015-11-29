var Util = require('./util');
var Channels = require('./channels/channels');
var EventsDispatcher = require('./events_dispatcher');
var Timeline = require('./timeline/timeline');
var TimelineSender = require('./timeline/timeline_sender');
var StrategyBuilder = require('./strategies/strategy_builder');
var ConnectionManager = require('./connection/connection_manager');
var PeriodicTimer = require('./utils/timers').PeriodicTimer;
var Defaults = require('./defaults');
var DefaultConfig = require('./config');
var Logger = require('./logger');
var Dependencies = require('./dependencies');

function Pusher(app_key, options) {

  if (!this instanceof Pusher) {
    return new Pusher(arguments);
  }

  checkAppKey(app_key);
  options = options || {};

  var self = this;

  this.key = app_key;
  this.config = Util.extend(
    DefaultConfig.getGlobalConfig(),
    options.cluster ? DefaultConfig.getClusterConfig(options.cluster) : {},
    options
  );

  this.channels = new Channels();
  this.global_emitter = new EventsDispatcher();
  this.sessionID = Math.floor(Math.random() * 1000000000);

  this.timeline = new Timeline(this.key, this.sessionID, {
    cluster: this.config.cluster,
    features: Util.getClientFeatures(),
    params: this.config.timelineParams || {},
    limit: 50,
    level: Timeline.INFO,
    version: Pusher.VERSION
  });
  if (!this.config.disableStats) {
    this.timelineSender = new TimelineSender(this.timeline, {
      host: this.config.statsHost,
      path: "/timeline/v2/jsonp"
    });
  }

  var getStrategy = function(options) {
    var config = Util.extend({}, self.config, options);
    return StrategyBuilder.build(
      Defaults.getDefaultStrategy(config), config
    );
  };

  this.connection = new ConnectionManager(
    this.key,
    Util.extend(
      { getStrategy: getStrategy,
        timeline: this.timeline,
        activityTimeout: this.config.activity_timeout,
        pongTimeout: this.config.pong_timeout,
        unavailableTimeout: this.config.unavailable_timeout
      },
      this.config,
      { encrypted: this.isEncrypted() }
    )
  );

  this.connection.bind('connected', function() {
    self.subscribeAll();
    if (self.timelineSender) {
      self.timelineSender.send(self.connection.isEncrypted());
    }
  });
  this.connection.bind('message', function(params) {
    var internal = (params.event.indexOf('pusher_internal:') === 0);
    if (params.channel) {
      var channel = self.channel(params.channel);
      if (channel) {
        channel.handleEvent(params.event, params.data);
      }
    }
    // Emit globally [deprecated]
    if (!internal) {
      self.global_emitter.emit(params.event, params.data);
    }
  });
  this.connection.bind('disconnected', function() {
    self.channels.disconnect();
  });
  this.connection.bind('error', function(err) {
    Pusher.warn('Error', err);
  });

  Pusher.instances.push(this);
  this.timeline.info({ instances: Pusher.instances.length });

  if (Pusher.isReady) {
    self.connect();
  }
}
var prototype = Pusher.prototype;

Pusher.instances = [];
Pusher.isReady = false;

Pusher.ready = function() {
  Pusher.isReady = true;
  for (var i = 0, l = Pusher.instances.length; i < l; i++) {
    Pusher.instances[i].connect();
  }
};

Dependencies.preparePusher(Pusher.ready);

Pusher.logToConsole = false;

if (window.console && window.console.log) {
  Pusher.log = function(message) {
    if (Pusher.logToConsole === true) {
      window.console.log(message);
    }
  };
}

Pusher.setLogger = function(logger){
  Logger.log = logger;
}

// To receive log output provide a Pusher.log function, for example
// Pusher.log = function(m){console.log(m)}
Pusher.debug = function() {
  if (!Pusher.log) {
    return;
  }
  Pusher.log(Util.stringify.apply(this, arguments));
};

Pusher.warn = function() {
  var message = Util.stringify.apply(this, arguments);
  if (window.console) {
    if (window.console.warn) {
      window.console.warn(message);
    } else if (window.console.log) {
      window.console.log(message);
    }
  }
  if (Pusher.log) {
    Pusher.log(message);
  }
};

prototype.channel = function(name) {
  return this.channels.find(name);
};

prototype.allChannels = function() {
  return this.channels.all();
};

prototype.connect = function() {
  this.connection.connect();

  if (this.timelineSender) {
    if (!this.timelineSenderTimer) {
      var encrypted = this.connection.isEncrypted();
      var timelineSender = this.timelineSender;
      this.timelineSenderTimer = new PeriodicTimer(60000, function() {
        timelineSender.send(encrypted);
      });
    }
  }
};

prototype.disconnect = function() {
  this.connection.disconnect();

  if (this.timelineSenderTimer) {
    this.timelineSenderTimer.ensureAborted();
    this.timelineSenderTimer = null;
  }
};

prototype.bind = function(event_name, callback) {
  this.global_emitter.bind(event_name, callback);
  return this;
};

prototype.bind_all = function(callback) {
  this.global_emitter.bind_all(callback);
  return this;
};

prototype.subscribeAll = function() {
  var channelName;
  for (channelName in this.channels.channels) {
    if (this.channels.channels.hasOwnProperty(channelName)) {
      this.subscribe(channelName);
    }
  }
};

prototype.subscribe = function(channel_name) {
  var channel = this.channels.add(channel_name, this);
  if (this.connection.state === 'connected') {
    channel.subscribe();
  }
  return channel;
};

prototype.unsubscribe = function(channel_name) {
  var channel = this.channels.remove(channel_name);
  if (channel && this.connection.state === 'connected') {
    channel.unsubscribe();
  }
};

prototype.send_event = function(event_name, data, channel) {
  return this.connection.send_event(event_name, data, channel);
};

prototype.isEncrypted = function() {
  if (Util.getDocument().location.protocol === "https:") {
    return true;
  } else {
    return Boolean(this.config.encrypted);
  }
};

function checkAppKey(key) {
  if (key === null || key === undefined) {
    throw "You must pass your app key when you instantiate Pusher.";
  }
}

Pusher.HTTP = {};

module.exports = Pusher;
