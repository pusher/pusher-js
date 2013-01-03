;(function() {
  function Pusher(app_key, options) {
    var self = this;

    this.options = options || {};
    this.key = app_key;
    this.channels = new Pusher.Channels();
    this.global_emitter = new Pusher.EventsDispatcher();
    this.sessionID = Math.floor(Math.random() * 1000000000);

    this.checkAppKey();

    this.connection = new Pusher.ConnectionManager(
      this.key,
      Pusher.Util.extend(
        { getStrategy: function(options) {
            return Pusher.StrategyBuilder.build(
              Pusher.Util.extend(Pusher.defaultStrategy, self.options, options)
            );
          },
          getTimeline: function(options, manager) {
            var scheme = "http" + (options.encrypted ? "s" : "") + "://";
            var jsonp = new Pusher.JSONPSender({
              url: scheme + Pusher.stats_host + "/timeline",
              receiver: Pusher.JSONP
            });
            var timeline = new Pusher.Timeline(
              self.sessionID, jsonp, {
                key: self.key,
                features: Pusher.Util.keys(
                  Pusher.Util.filterObject(
                    { "ws": Pusher.WSTransport,
                      "flash": Pusher.FlashTransport
                    },
                    function (t) { return t.isSupported(); }
                  )
                ),
                limit: 25
              }
            );

            var sendTimeline = function() {
              if (!timeline.isEmpty()) {
                timeline.send(function() {});
              }
            };
            manager.bind("connected", sendTimeline);
            setInterval(sendTimeline, 60000);

            return timeline;
          },
          activityTimeout: Pusher.activity_timeout,
          pongTimeout: Pusher.pong_timeout,
          unavailableTimeout: Pusher.unavailable_timeout
        },
        this.options
      )
    );

    // Setup / teardown connection
    this.connection
      .bind('connected', function() {
        self.subscribeAll();
      })
      .bind('message', function(params) {
        var internal = (params.event.indexOf('pusher_internal:') === 0);
        if (params.channel) {
          var channel = self.channel(params.channel);
          if (channel) {
            channel.emit(params.event, params.data);
          }
        }
        // Emit globaly [deprecated]
        if (!internal) self.global_emitter.emit(params.event, params.data);
      })
      .bind('disconnected', function() {
        self.channels.disconnect();
      })
      .bind('error', function(err) {
        Pusher.warn('Error', err);
      });

    Pusher.instances.push(this);

    if (Pusher.isReady) self.connect();
  }

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
    if (window.console && window.console.warn) {
      window.console.warn(Pusher.Util.stringify.apply(this, arguments));
    } else {
      if (!Pusher.log) {
        return;
      }
      Pusher.log(Pusher.Util.stringify.apply(this, arguments));
    }
  };

  Pusher.ready = function() {
    Pusher.isReady = true;
    for (var i = 0, l = Pusher.instances.length; i < l; i++) {
      Pusher.instances[i].connect();
    }
  };

  Pusher.prototype = {
    channel: function(name) {
      return this.channels.find(name);
    },

    connect: function() {
      this.connection.connect();
    },

    disconnect: function() {
      this.connection.disconnect();
    },

    bind: function(event_name, callback) {
      this.global_emitter.bind(event_name, callback);
      return this;
    },

    bind_all: function(callback) {
      this.global_emitter.bind_all(callback);
      return this;
    },

    subscribeAll: function() {
      var channelName;
      for (channelName in this.channels.channels) {
        if (this.channels.channels.hasOwnProperty(channelName)) {
          this.subscribe(channelName);
        }
      }
    },

    subscribe: function(channel_name) {
      var self = this;
      var channel = this.channels.add(channel_name, this);

      if (this.connection.state === 'connected') {
        channel.authorize(this.connection.socket_id, this.options, function(err, data) {
          if (err) {
            channel.emit('pusher:subscription_error', data);
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
    },

    unsubscribe: function(channel_name) {
      this.channels.remove(channel_name);
      if (this.connection.state === 'connected') {
        this.send_event('pusher:unsubscribe', {
          channel: channel_name
        });
      }
    },

    send_event: function(event_name, data, channel) {
      return this.connection.send_event(event_name, data, channel);
    },

    checkAppKey: function() {
      if(this.key === null || this.key === undefined) {
        Pusher.warn('Warning', 'You must pass your app key when you instantiate Pusher.');
      }
    }
  };

  this.Pusher = Pusher;
}).call(this);
