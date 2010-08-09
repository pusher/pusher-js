if(typeof Function.prototype.scopedTo == 'undefined'){
  Function.prototype.scopedTo = function(context, args){
    var f = this;
    return function(){
      return f.apply(context, Array.prototype.slice.call(args || [])
        .concat(Array.prototype.slice.call(arguments)));
    };
  };
};

var Pusher = function(application_key, channel_name) {
  this.path = '/app/' + application_key;
  this.key = application_key;
  this.socket_id;
  this.channels = new Pusher.Channels();
  this.global_channel = new Pusher.Channel('pusher_global_channel')
  this.global_channel.global = true;
  this.secure = false;
  this.connected = false;
  this.retry_counter = 0;
  this.connect();

  if (channel_name) this.subscribe(channel_name);

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

Pusher.prototype = {
  channel: function(name) {
    return this.channels.find(name);
  },

  connect: function() {
    var url = "ws://" + Pusher.host + ":" + Pusher.ws_port + this.path;
    if (this.secure == true){
      url = "wss://" + Pusher.host + ":" + Pusher.wss_port + this.path;
    }

    Pusher.allow_reconnect = true;
    Pusher.log('Pusher : connecting : ' + url );

    var self = this;

    if (window["WebSocket"]) {
      this.connection = new WebSocket(url);
      this.connection.onmessage = function() {
        self.onmessage.apply(self, arguments);
      };
      this.connection.onclose = function() {
        self.onclose.apply(self, arguments);
      };
      this.connection.onopen = function() {
        self.onopen.apply(self, arguments);
      };
    } else {
      // Mock connection object if WebSockets are not available.
      this.connection = {};
      setTimeout(function(){
        self.send_local_event("pusher:connection_failed", {})
        }, 3000)
    }
  },

  toggle_secure: function() {
    if (this.secure == false) {
      this.secure = true;
      Pusher.log("Pusher: switching to wss:// connection");
    }else{
      this.secure = false;
      Pusher.log("Pusher: switching to ws:// connection");
    };
  },


  disconnect: function() {
    Pusher.log('Pusher : disconnecting');
    Pusher.allow_reconnect = false;
    Pusher.retry_count = 0;
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
    var channel = this.channels.add(channel_name);
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
  
  
  // Not currently supported by pusherapp.com
  send_event: function(event_name, data) {
    var payload = JSON.stringify({ 'event' : event_name, 'data' : data });
    Pusher.log("Pusher : sending event : ", payload);
    this.connection.send(payload);
    return this;
  },
  
  send_local_event: function(event_name, event_data, channel_name){
    event_data = Pusher.data_decorator(event_name, event_data);
     if (channel_name) {
         var channel = this.channel(channel_name);
         if (channel) {
           channel.dispatch_with_all(event_name, event_data);
         }
       }

       this.global_channel.dispatch_with_all(event_name, event_data);
       Pusher.log("Pusher : event received : channel: " + channel_name +
         "; event: " + event_name, event_data);
  },
  
  onmessage: function(evt) {
    var params = Pusher.parser(evt.data);
    if (params.socket_id && params.socket_id == this.socket_id) return;
    var event_name = params.event,
        event_data = Pusher.parser(params.data),
        channel_name = params.channel;
        
    this.send_local_event(event_name, event_data, channel_name);
  },

  wait_and_reconnect: function(perform_toggle, ms_to_wait){
    setTimeout(function(){
      perform_toggle();
      this.connect();
    }.scopedTo(this), ms_to_wait)
  },

  onclose: function() {
    var self = this;
    this.global_channel.dispatch('close', null);
    Pusher.log ("Pusher: Socket closed")
    var time = 5000;
    if ( this.connected == true ) {
      this.send_local_event("pusher:connection_disconnected", {});
      if (Pusher.allow_reconnect){
        Pusher.log('Pusher : Reconnecting in 5 seconds...');
        this.wait_and_reconnect(function(){}, time)
      }
    } else {
      self.send_local_event("pusher:connection_failed", {});
      if (this.retry_counter == 0){
        time = 100;
      }
      this.retry_counter = this.retry_counter + 1
      this.wait_and_reconnect(function(){self.toggle_secure()}, time);
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

Pusher.VERSION = "<%= VERSION %>";
Pusher.host = "ws.pusherapp.com";
Pusher.ws_port = 80;
Pusher.wss_port = 443;
Pusher.channel_auth_endpoint = '/pusher/auth';
Pusher.log = function(msg){}; // e.g. function(m){console.log(m)}
Pusher.data_decorator = function(event_name, event_data){ return event_data }; // wrap event_data before dispatching
Pusher.allow_reconnect = true;
Pusher.parser = function(data) {
  try {
    return JSON.parse(data);
  } catch(e) {
    Pusher.log("Pusher : data attribute not valid JSON - you may wish to implement your own Pusher.parser");
    return data;
  }
};
