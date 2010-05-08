var Pusher = function(application_key, channel_name) {
  this.url = 'ws://' + Pusher.host + '/app/' + application_key;
  this.socket_id;
  this.channels = new Pusher.Channels();
  this.global_channel = new Pusher.GlobalChannel()
  this.connected = false;
  this.connect();
  
  var self = this;

  this.bind('connection_established', function(data) {
    self.connected = true;
    if (channel_name){
      self.subscribe(channel_name);
    }
    self.socket_id = data.socket_id;
    // self.subscribeAll(self.channels.channels);
  });
};

Pusher.prototype = {
  connect: function() {
    var self = this;

    if (window["WebSocket"]) {
      this.connection = new WebSocket(this.url);
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
    }
  },

  bind: function(event_name, callback) {
    this.global_channel.bind(event_name, callback)
    return this;
  },

  bind_all: function(callback) {
    this.global_channel.bind_all(callback)
    return this;
  },
  
  subscribeAll: function(channel_names) {
    for (var i = 0; i < channel_names.length; i++) {
      this.subscribe(channel_names[i]);
    }
  },
  
  subscribe: function(channel_name) {
    var channel = this.channels.add(channel_name);
    
    if (this.connected) {
      this.trigger('pusher:subscribe', {
        channel: channel_name
      });
    }
    return channel;
  },
  
  unsubscribe: function(channel_name) {
    this.channels.remove(channel_name);

    if (this.connected) {
      this.trigger('pusher:unsubscribe', {
        channel: channel_name
      });
    }
  },
  
  // Not currently supported by pusherapp.com
  trigger: function(event_name, data) {
    var payload = JSON.stringify({ 'event' : event_name, 'data' : data });
    Pusher.log("Pusher : sending event : " + payload);
    this.connection.send(payload);
    return this;
  },

  onmessage: function(evt) {
    var params = JSON.parse(evt.data);
    if (params.socket_id && params.socket_id == this.socket_id) return;
    var event_name = params.event;
    var event_data = Pusher.parser(params.data);
    // temporary fix to braodcast to single channel
    if (event_data.channel_name) {
      var channel = this.channels.find(event_data.channel_name)
      if (channel){
        channel.dispatch_with_all(event_name, event_data); 
      }
    }
    this.global_channel.dispatch_with_all(event_name, event_data);
    Pusher.log("Pusher : event received : " + event_name +" : ", event_data);
  },

  onclose: function() {
    this.global_channel.dispatch('close', null);
    this.connected = false;

    var self = this;

    if (Pusher.allow_reconnect){
      Pusher.log('Pusher : socket closed : Reconnecting in 5 seconds...');

      setTimeout(function() {
        Pusher.log('Pusher : reconnecting');
        self.connect();
      }, 5000);
    }
  },

  onopen: function() {
    this.global_channel.dispatch('open', null);
  }
};

// Pusher defaults

Pusher.VERSION = "<%= VERSION %>";
Pusher.host = "ws.pusherapp.com:80";
Pusher.log = function(msg){}; // e.g. function(m){console.log(m)}
Pusher.allow_reconnect = true;
Pusher.parser = function(data) {
  try {
    return JSON.parse(data);
  } catch(e) {
    Pusher.log("Pusher : data attribute not valid JSON - you may wish to implement your own Pusher.parser");
    return data;
  }
};
