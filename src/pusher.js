var Pusher = function(application_key, channel) {
  this.url = 'ws://' + Pusher.host + '/app/' + application_key + "?channel=" + channel;
  this.socket_id;
  this.callbacks = {};
  this.global_callbacks = [];
  this.connect();

  var self = this;

  this.bind('connection_established', function(data) {
    self.socket_id = data.socket_id;
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

  onmessage: function(evt) {
    var params = JSON.parse(evt.data);
    if (params.socket_id && params.socket_id == this.socket_id) return;
    var event_name = params.event;
    var event_data = Pusher.parser(params.data);
    Pusher.log("Pusher : event received : " + event_name +" : "+ event_data);
    this.dispatch_global_callbacks(event_name, event_data);
    this.dispatch(event_name, event_data);
  },

  onclose: function() {
    this.dispatch('close', null);

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
