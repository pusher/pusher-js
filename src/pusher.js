var Pusher = function(application_key, channel) {
  this.url = 'ws://' + Pusher.host + '/app/' + application_key;
  this.key = application_key;
  this.socket_id;
  this.callbacks = {};
  this.global_callbacks = [];
  this.channels = new Pusher.Channels(channel);
  this.connected = false;
  this.connect();
  
  var self = this;

  this.bind('connection_established', function(data) {
    self.connected = true;
    self.socket_id = data.socket_id;
    self.subscribeAll(self.channels.channels);
  });

  this.bind('pusher:error', function(data) {
    Pusher.log("Pusher : error : " + data.message);
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
    this.callbacks[event_name] = this.callbacks[event_name] || [];
    this.callbacks[event_name].push(callback);
    return this;
  },

  bind_all: function(callback) {
    this.global_callbacks.push(callback);
    return this;
  },

  // Not currently supported by pusherapp.com
  trigger: function(event_name, data) {
    var payload = JSON.stringify({ 'event' : event_name, 'data' : data });
    Pusher.log("Pusher : sending event : " + payload);
    this.connection.send(payload);
    return this;
  },
  
  subscribeAll: function(channel_names) {
    for (var i = 0; i < channel_names.length; i++) {
      this.subscribe(channel_names[i]);
    }
  },
  
  subscribe: function(channel_name) {
    this.channels.add(channel_name);
    
    if (this.connected) {
      if (channel_name.indexOf("private-") === 0) {
        var self = this;
        var xhr = window.XMLHttpRequest ?
          new XMLHttpRequest() :
          new ActiveXObject("Microsoft.XMLHTTP");
        xhr.open("POST", Pusher.channel_auth_endpoint, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
        xhr.onreadystatechange = function() {
          if (xhr.readyState == 4) {
            if (xhr.status == 200) {
              var data = JSON.parse(xhr.responseText);
              self.trigger('pusher:subscribe', {
                channel: channel_name,
                auth: self.key + ':' + data.auth
              });
            } else {
              Pusher.log("Couldn't get auth info from your webapp" + status);
            }
          }
        };
        xhr.send('socket_id=' + encodeURIComponent(this.socket_id) + '&channel_name=' + encodeURIComponent(channel_name));
      } else {
        this.trigger('pusher:subscribe', {
          channel: channel_name
        });
      }
    }
  },
  
  unsubscribe: function(channel_name) {
    this.channels.remove(channel_name);

    if (this.connected) {
      this.trigger('pusher:unsubscribe', {
        channel: channel_name
      });
    }
  },

  onmessage: function(evt) {
    var params = JSON.parse(evt.data);
    if (params.socket_id && params.socket_id == this.socket_id) return;
    var event_name = params.event;
    var event_data = Pusher.parser(params.data);
    Pusher.log("Pusher : event received : " + event_name +" : ", event_data);
    this.dispatch_global_callbacks(event_name, event_data);
    this.dispatch(event_name, event_data);
  },

  onclose: function() {
    this.dispatch('close', null);
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
    this.dispatch('open', null);
  },

  dispatch: function(event_name, event_data) {
    var callbacks = this.callbacks[event_name];

    if (callbacks) {
      for (var i = 0; i < callbacks.length; i++) {
        callbacks[i](event_data);
      }
    } else {
      Pusher.log('Pusher : No callbacks for ' + event_name);
    }
  },

  dispatch_global_callbacks: function(event_name, event_data) {
    for (var i = 0; i < this.global_callbacks.length; i++) {
      this.global_callbacks[i](event_name, event_data);
    }
  }
};

// Pusher defaults

Pusher.VERSION = "<%= VERSION %>";
Pusher.host = "ws.pusherapp.com:80";
Pusher.channel_auth_endpoint = '/pusher/auth';
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
