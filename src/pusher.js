if (typeof Function.prototype.scopedTo === 'undefined') {
  Function.prototype.scopedTo = function(context, args) {
    var f = this;
    return function() {
      return f.apply(context, Array.prototype.slice.call(args || [])
        .concat(Array.prototype.slice.call(arguments)));
    };
  };
}

var Pusher = function(app_key, options) {
  this.options = options || {};
  this.key = app_key;
  this.channels = new Pusher.Channels();
  this.global_channel = new Pusher.Channel('pusher_global_channel');
  this.global_channel.global = true;

  var self = this;

  this.connection = new Pusher.Connection(this.key, this.options);

  // Setup / teardown connection
  this.connection
    .bind('connected', function() {
      self.subscribeAll();
    })
    .bind('message', function(params) {
      self.send_local_event(params.event, params.data, params.channel);
    })
    .bind('disconnected', function() {
      self.channels.disconnect();
    })
    .bind('error', function(err) {
      Pusher.debug('Error', err);
    });

  Pusher.instances.push(this);

  if (Pusher.isReady) self.connect();
};
Pusher.instances = [];
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
    this.global_channel.bind(event_name, callback);
    return this;
  },

  bind_all: function(callback) {
    this.global_channel.bind_all(callback);
    return this;
  },

  subscribeAll: function() {
    var channel;
    for (channel in this.channels.channels) {
      if (this.channels.channels.hasOwnProperty(channel)) {
        this.subscribe(channel);
      }
    }
  },

  subscribe: function(channel_name) {
    var self = this;
    var channel = this.channels.add(channel_name, this);
    if (this.connection.state === 'connected') {
      channel.authorize(this, function(err, data) {
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
    this.connection.send_event(event_name, data, channel);
    return this;
  },

  send_local_event: function(event_name, event_data, channel_name) {
    event_data = Pusher.data_decorator(event_name, event_data);
    if (channel_name) {
      var channel = this.channel(channel_name);
      if (channel) {
        channel.dispatch_with_all(event_name, event_data);
      }
    } else {
      // Bit hacky but these events won't get logged otherwise
      Pusher.debug("Event recd (event,data)", event_name, event_data);
    }

    this.global_channel.dispatch_with_all(event_name, event_data);
  }
};

Pusher.Util = {
  extend: function extend(target, extensions) {
    for (var property in extensions) {
      if (extensions[property] && extensions[property].constructor &&
        extensions[property].constructor === Object) {
        target[property] = extend(target[property] || {}, extensions[property]);
      } else {
        target[property] = extensions[property];
      }
    }
    return target;
  }
};

// To receive log output provide a Pusher.log function, for example
// Pusher.log = function(m){console.log(m)}
Pusher.debug = function() {
  if (!Pusher.log) { return }
  var m = ["Pusher"]
  for (var i = 0; i < arguments.length; i++){
    if (typeof arguments[i] === "string") {
      m.push(arguments[i])
    } else {
      if (window['JSON'] == undefined) {
        m.push(arguments[i].toString());
      } else {
        m.push(JSON.stringify(arguments[i]))
      }
    }
  };
  Pusher.log(m.join(" : "))
}

// Pusher defaults
Pusher.VERSION = '<VERSION>';

Pusher.host = 'ws.pusherapp.com';
Pusher.ws_port = 80;
Pusher.wss_port = 443;
Pusher.channel_auth_endpoint = '/pusher/auth';
Pusher.cdn_http = '<CDN_HTTP>'
Pusher.cdn_https = '<CDN_HTTPS>'
Pusher.dependency_suffix = '<DEPENDENCY_SUFFIX>';
Pusher.data_decorator = function(event_name, event_data){ return event_data }; // wrap event_data before dispatching
Pusher.channel_auth_transport = 'ajax';

Pusher.isReady = false;
Pusher.ready = function() {
  Pusher.isReady = true;
  for (var i = 0, l = Pusher.instances.length; i < l; i++) {
    Pusher.instances[i].connect();
  }
};
