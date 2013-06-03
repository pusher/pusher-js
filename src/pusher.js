;(function() {
  function Pusher(app_key, options) {
    options = options || {};

    var self = this;

    this.key = app_key;
    this.options = Pusher.Util.extend(
      Pusher.getGlobalConfig(),
      options.cluster ? Pusher.getClusterConfig(options.cluster) : {},
      options
    );

    this.channels = new Pusher.Channels();
    this.global_emitter = new Pusher.EventsDispatcher();
    this.sessionID = Math.floor(Math.random() * 1000000000);

    checkAppKey(this.key);

    var getStrategy = function(options) {
      return Pusher.StrategyBuilder.build(
        Pusher.getDefaultStrategy(self.options),
        Pusher.Util.extend({}, self.options, options)
      );
    };
    var getTimeline = function() {
      return new Pusher.Timeline(self.key, self.sessionID, {
        features: Pusher.Util.getClientFeatures(),
        params: self.options.timelineParams || {},
        limit: 50,
        level: Pusher.Timeline.INFO,
        version: Pusher.VERSION
      });
    };
    var getTimelineSender = function(timeline, options) {
      if (self.options.disableStats) {
        return null;
      }
      return new Pusher.TimelineSender(timeline, {
        encrypted: self.isEncrypted() || !!options.encrypted,
        host: self.options.stats_host,
        path: "/timeline"
      });
    };

    this.connection = new Pusher.ConnectionManager(
      this.key,
      Pusher.Util.extend(
        { getStrategy: getStrategy,
          getTimeline: getTimeline,
          getTimelineSender: getTimelineSender,
          activityTimeout: this.options.activity_timeout,
          pongTimeout: this.options.pong_timeout,
          unavailableTimeout: this.options.unavailable_timeout
        },
        this.options,
        { encrypted: this.isEncrypted() }
      )
    );

    this.connection.bind('connected', function() {
      self.subscribeAll();
    });
    this.connection.bind('message', function(params) {
      var internal = (params.event.indexOf('pusher_internal:') === 0);
      if (params.channel) {
        var channel = self.channel(params.channel);
        if (channel) {
          channel.handleEvent(params.event, params.data);
        }
      }
      // Emit globaly [deprecated]
      if (!internal) self.global_emitter.emit(params.event, params.data);
    });
    this.connection.bind('disconnected', function() {
      self.channels.disconnect();
    });
    this.connection.bind('error', function(err) {
      Pusher.warn('Error', err);
    });

    Pusher.instances.push(this);

    if (Pusher.isReady) self.connect();
  }
  var prototype = Pusher.prototype;

  Pusher.instances = [];
  Pusher.isReady = false;

  // To receive log output provide a Pusher.log function, for example
  // Pusher.log = function(m){console.log(m)}
  Pusher.debug = function() {
    if (!Pusher.log) {
      return;
    }
    Pusher.log(Pusher.Util.stringify.apply(this, arguments));
  };

  Pusher.warn = function() {
    var message = Pusher.Util.stringify.apply(this, arguments);
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

  Pusher.ready = function() {
    Pusher.isReady = true;
    for (var i = 0, l = Pusher.instances.length; i < l; i++) {
      Pusher.instances[i].connect();
    }
  };

  prototype.channel = function(name) {
    return this.channels.find(name);
  };

  prototype.connect = function() {
    this.connection.connect();
  };

  prototype.disconnect = function() {
    this.connection.disconnect();
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
    var self = this;
    var channel = this.channels.add(channel_name, this);

    if (this.connection.state === 'connected') {
      channel.authorize(this.connection.socket_id, {}, function(err, data) {
        if (err) {
          channel.handleEvent('pusher:subscription_error', data);
        } else {
          self.send_event('pusher:subscribe', {
            channel: channel_name,
            auth: data.auth,
            channel_data: data.channel_data
          });
        }
      });
    }
    return channel;
  };

  prototype.unsubscribe = function(channel_name) {
    this.channels.remove(channel_name);
    if (this.connection.state === 'connected') {
      this.send_event('pusher:unsubscribe', {
        channel: channel_name
      });
    }
  };

  prototype.send_event = function(event_name, data, channel) {
    return this.connection.send_event(event_name, data, channel);
  };

  prototype.isEncrypted = function() {
    if (Pusher.Util.getDocumentLocation().protocol === "https:") {
      return true;
    } else {
      return !!this.options.encrypted;
    }
  };

  function checkAppKey(key) {
    if (key === null || key === undefined) {
      Pusher.warn(
        'Warning', 'You must pass your app key when you instantiate Pusher.'
      );
    }
  }

  this.Pusher = Pusher;
}).call(this);
