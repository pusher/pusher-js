if(typeof Function.prototype.scopedTo == 'undefined'){
  Function.prototype.scopedTo = function(context, args){
    var f = this;
    return function(){
      return f.apply(context, Array.prototype.slice.call(args || [])
        .concat(Array.prototype.slice.call(arguments)));
    };
  };
};

var Pusher = function(application_key, options) {
  this.options = options || {};
  this.path = '/app/' + application_key + "?client=js&version=" + Pusher.VERSION;
  this.key = application_key;
  this.socket_id;
  this.channels = new Pusher.Channels();
  this.global_channel = new Pusher.Channel('pusher_global_channel')
  this.global_channel.global = true;
  this.secure = false;
  this.connected = false;
  this.retry_counter = 0;
  this.encrypted = this.options.encrypted ? true : false;
  if(Pusher.isReady) this.connect();
  Pusher.instances.push(this);

  //This is the new namespaced version
  this.bind('pusher:connection_established', function(data) {
    this.connected = true;
    this.retry_counter = 0;
    this.socket_id = data.socket_id;
    this.subscribeAll();
  }.scopedTo(this));
  
  this.bind('pusher:connection_disconnected', function(){
    for(var channel_name in this.channels.channels){
      this.channels.channels[channel_name].disconnect()
    }
  }.scopedTo(this));

  this.bind('pusher:error', function(data) {
    Pusher.log("Pusher : error : " + data.message);
  });
  
};

Pusher.instances = [];
Pusher.prototype = {
  channel: function(name) {
    return this.channels.find(name);
  },

  connect: function() {
    if (this.encrypted || this.secure) {
      var url = "wss://" + Pusher.host + ":" + Pusher.wss_port + this.path;
    } else {
      var url = "ws://" + Pusher.host + ":" + Pusher.ws_port + this.path;
    }

    Pusher.allow_reconnect = true;
    Pusher.log('Pusher : connecting : ' + url );

    var self = this;

    if (window["WebSocket"]) {
      var ws = new WebSocket(url);

      // Timeout for the connection to handle silently hanging connections
      // Increase the timeout after each retry in case of extreme latencies
      var timeout = Pusher.connection_timeout + (self.retry_counter * 1000);
      var connectionTimeout = window.setTimeout(function(){
        Pusher.log('Pusher : connection timeout after ' + timeout + 'ms');
        ws.close();
      }, timeout);

      ws.onmessage = function() {
        self.onmessage.apply(self, arguments);
      };
      ws.onclose = function() {
        window.clearTimeout(connectionTimeout);
        self.onclose.apply(self, arguments);
      };
      ws.onopen = function() {
        window.clearTimeout(connectionTimeout);
        self.onopen.apply(self, arguments);
      };

      this.connection = ws;
    } else {
      // Mock connection object if WebSockets are not available.
      this.connection = {};
      setTimeout(function(){
        self.send_local_event("pusher:connection_failed", {})
      }, 0);
    }
  },

  toggle_secure: function() {
    if (this.secure == false) {
      this.secure = true;
      Pusher.log("Pusher : switching to wss:// connection");
    }else{
      this.secure = false;
      Pusher.log("Pusher : switching to ws:// connection");
    };
  },


  disconnect: function() {
    Pusher.log('Pusher : disconnecting');
    Pusher.allow_reconnect = false;
    this.retry_counter = 0;
    this.connection.close();
  },

  bind: function(event_name, callback) {
    this.global_channel.bind(event_name, callback)
    return this;
  },

  bind_all: function(callback) {
    this.global_channel.bind_all(callback)
    return this;
  },

  subscribeAll: function() {
    for (var channel in this.channels.channels) {
      if (this.channels.channels.hasOwnProperty(channel)) this.subscribe(channel);
    }
  },
  
  subscribe: function(channel_name) {
    var channel = this.channels.add(channel_name, this);
    if (this.connected) {
      channel.authorize(this, function(data){
        this.send_event('pusher:subscribe', {
          channel: channel_name,
          auth: data.auth,
          channel_data: data.channel_data
        });
      }.scopedTo(this));
    }
    return channel;
  },
  
  unsubscribe: function(channel_name) {
    this.channels.remove(channel_name);

    if (this.connected) {
      this.send_event('pusher:unsubscribe', {
        channel: channel_name
      });
    }
  },

  send_event: function(event_name, data, channel) {
    Pusher.log("Pusher : event sent (channel,event,data) : ", channel, event_name, data);

    var payload = {
      event: event_name,
      data: data
    };
    if (channel) { payload['channel'] = channel };

    this.connection.send(JSON.stringify(payload));
    return this;
  },
  
  send_local_event: function(event_name, event_data, channel_name){
    event_data = Pusher.data_decorator(event_name, event_data);
    if (channel_name) {
      var channel = this.channel(channel_name);
      if (channel) {
        channel.dispatch_with_all(event_name, event_data);
      }
    } else {
      // Bit hacky but these events won't get logged otherwise
      Pusher.log("Pusher : event recd (event,data) :", event_name, event_data);
    }

    this.global_channel.dispatch_with_all(event_name, event_data);
  },
  
  onmessage: function(evt) {
    var params = JSON.parse(evt.data);
    if (params.socket_id && params.socket_id == this.socket_id) return;
    // Try to parse the event data unless it has already been decoded
    if (typeof(params.data) == 'string') {
      params.data = Pusher.parser(params.data);
    }
    // Pusher.log("Pusher : received message : ", params)

    this.send_local_event(params.event, params.data, params.channel);
  },

  reconnect: function() {
    var self = this;
    setTimeout(function() {
      self.connect();
    }, 0);
  },

  retry_connect: function() {
    // Unless we're ssl only, try toggling between ws & wss
    if (!this.encrypted) {
      this.toggle_secure();
    }

    // Retry with increasing delay, with a maximum interval of 10s
    var retry_delay = Math.min(this.retry_counter * 1000, 10000);
    Pusher.log("Pusher : Retrying connection in " + retry_delay + "ms");
    var self = this;
    setTimeout(function() {
      self.connect();
    }, retry_delay);

    this.retry_counter = this.retry_counter + 1;
  },

  onclose: function() {
    this.global_channel.dispatch('close', null);
    Pusher.log("Pusher : Socket closed")
    if (this.connected) {
      this.send_local_event("pusher:connection_disconnected", {});
      if (Pusher.allow_reconnect) {
        Pusher.log('Pusher : Connection broken, trying to reconnect');
        this.reconnect();
      }
    } else {
      this.send_local_event("pusher:connection_failed", {});
      this.retry_connect();
    }
    this.connected = false;
  },

  onopen: function() {
    this.global_channel.dispatch('open', null);
  }
};

Pusher.Util = {
  extend: function(target, extensions){
    for(var i in extensions){
      target[i] = extensions[i]
    };
    return target;
  }
};

// Pusher defaults
Pusher.VERSION = "<VERSION>";

Pusher.host = "ws.pusherapp.com";
Pusher.ws_port = 80;
Pusher.wss_port = 443;
Pusher.channel_auth_endpoint = '/pusher/auth';
Pusher.connection_timeout = 5000;
Pusher.cdn_http = '<CDN_HTTP>'
Pusher.cdn_https = '<CDN_HTTPS>'
Pusher.log = function(msg){}; // e.g. function(m){console.log(m)}
Pusher.data_decorator = function(event_name, event_data){ return event_data }; // wrap event_data before dispatching
Pusher.allow_reconnect = true;
Pusher.channel_auth_transport = 'ajax';
Pusher.parser = function(data) {
  try {
    return JSON.parse(data);
  } catch(e) {
    Pusher.log("Pusher : data attribute not valid JSON - you may wish to implement your own Pusher.parser");
    return data;
  }
};

Pusher.isReady = false;
Pusher.ready = function () {
  Pusher.isReady = true;
  for(var i = 0; i < Pusher.instances.length; i++) {
    if(!Pusher.instances[i].connected) Pusher.instances[i].connect();
  }
}

