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
  this.path = '/app/' + app_key + '?client=js&version=' + Pusher.VERSION;
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
    Pusher.debug('Disconnecting');
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
          channel.emit('subscription_error', data);
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
    Pusher.debug("Event sent (channel,event,data)", channel, event_name, data);

    var payload = {
      event: event_name,
      data: data
    };
    if (channel) payload['channel'] = channel;

    this.connection.send(JSON.stringify(payload));
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
  },
  
  /**
   * Subscribe to multiple channels in one call. The underlying authentication request, if required.
   * is also performed using a single call.
   *
   * @return a map of channel names to channel objects.
   *
   * @example
   * var pusher = new Pusher("APP_KEY");
   * var channels = pusher.multiSubscribe(['private-channel1', 'private-channel2']);
   * var channel1 = channels['private-channel1'];
   */
  multiSubscribe: function(channels) {
    var channelName;
    var channel;
    var newChannels = {};
    for(var i = 0, l = channels.length; i < l; ++i) {
      channelName = channels[i];
      channel = this.channels.add(channelName, this);
      newChannels[channelName] = channel;
    }
    
    if (this.connection.state === 'connected') {
      this._multiAuth(channels, function(err, authData) {
        if (err) {
          channel.emit('subscription_error', authData);
        } else {
          self._sendSubscriptionEvents(channels, authData);
        }
      });
    }
    
    return newChannels;
  },
  
  /** @private */
  _multiAuth: function(channels, callback) {
    var self = this;
    
    var xhr = window.XMLHttpRequest ?
      new XMLHttpRequest() :
      new ActiveXObject("Microsoft.XMLHTTP");
    xhr.open("POST", Pusher.channel_multiauth_endpoint, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          var data = JSON.parse(xhr.responseText);
          callback(false, data);
        } else {
          Pusher.debug("Couldn't get multiauth info from your webapp", status);
          callback(true, xhr.status);
        }
      }
    };
    
    var channelsToAuthorize = this._filterAuthChannels(channels);
    var authRequest = {
      socket_id: self.connection.socket_id,
      channels: channelsToAuthorize
    };
    var postData = JSON.stringify(authRequest);
    xhr.send(postData);
  },
  
  /** @private */
  _filterAuthChannels: function(channels) {
    var channelsToAuth = [];
    var channelName;
    for(var i = 0, l = channels.length; i < l; ++i) {
      channelName = channels[i];
      if(Pusher.Util.startsWith(channelName)) {
        channelsToAuth.push(channelName);
      }
    }
    return channelsToAuth;
  },
  
  /** @private */
  _sendSubscriptionEvents: function(channels, authData) {
    var channelName;
    var channelAuth;
    for(var i = 0, l = channels.length; i < l; ++i) {
      channelName = channels[i];
      channelAuth = authData[channelName] || {};
      this.send_event('pusher:subscribe', {
        channel: channelName,
        auth: channelAuth.auth,
        channel_data: channelAuth.channel_data
      });
    }
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
  },
  startsWith: function(check, startsWith){
    return check.substring(0, startsWith.length-1) === startsWith;
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
Pusher.channel_multiauth_endpoint = '/pusher/multiauth'
Pusher.connection_timeout = 5000;
Pusher.cdn_http = '<CDN_HTTP>'
Pusher.cdn_https = '<CDN_HTTPS>'
Pusher.data_decorator = function(event_name, event_data){ return event_data }; // wrap event_data before dispatching
Pusher.allow_reconnect = true;
Pusher.channel_auth_transport = 'ajax';

Pusher.isReady = false;
Pusher.ready = function() {
  Pusher.isReady = true;
  for (var i = 0, l = Pusher.instances.length; i < l; i++) {
    Pusher.instances[i].connect();
  }
};
