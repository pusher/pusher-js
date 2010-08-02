Pusher.Channels = function() {
  this.channels = {};
};

Pusher.Channels.prototype = {
  add: function(channel_name) {
    var existing_channel = this.find(channel_name);
    if (!existing_channel) {
      var channel = Pusher.Channel.factory(channel_name);
      this.channels[channel_name] = channel;
      return channel;
    } else {
      return existing_channel;
    }
  },

  find: function(channel_name) {
    return this.channels[channel_name];
  },

  remove: function(channel_name) {
    delete this.channels[channel_name];
  }
};

Pusher.Channel = function(channel_name) {
  this.name = channel_name;
  this.callbacks = {};
  this.global_callbacks = [];
};

Pusher.Channel.prototype = {
  bind: function(event_name, callback) {
    this.callbacks[event_name] = this.callbacks[event_name] || [];
    this.callbacks[event_name].push(callback);
    return this;
  },

  bind_all: function(callback) {
    this.global_callbacks.push(callback);
    return this;
  },

  dispatch_with_all: function(event_name, data) {
    this.dispatch(event_name, data);
    this.dispatch_global_callbacks(event_name, data);
  },

  dispatch: function(event_name, event_data) {
    var callbacks = this.callbacks[event_name];

    if (callbacks) {
      for (var i = 0; i < callbacks.length; i++) {
        callbacks[i](event_data);
      }
    } else if (!this.global) {
      Pusher.log('Pusher : No callbacks for ' + event_name);
    }
  },

  dispatch_global_callbacks: function(event_name, event_data) {
    for (var i = 0; i < this.global_callbacks.length; i++) {
      this.global_callbacks[i](event_name, event_data);
    }
  },
  
  is_private: function(){
    return false;
  },
  
  is_presence: function(){
    return false;
  },
  
  authorize: function(pusher, callback){
    callback(null); // normal channels don't require auth
  }
};

Pusher.Channel.PrivateChannel = {
  is_private: function(){
    return true;
  },
  
  authorize: function(pusher, callback){
    var self = this;
    var xhr = window.XMLHttpRequest ?
      new XMLHttpRequest() :
      new ActiveXObject("Microsoft.XMLHTTP");
    xhr.open("POST", Pusher.channel_auth_endpoint, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          var data = Pusher.parser(xhr.responseText);
          callback(data.auth);
        } else {
          Pusher.log("Couldn't get auth info from your webapp" + status);
        }
      }
    };
    xhr.send('socket_id=' + encodeURIComponent(pusher.socket_id) + '&channel_name=' + encodeURIComponent(self.name));
  }
};

Pusher.Channel.PresenceChannel = {
  is_presence: function(){
    return true;
  }
};

Pusher.Channel.factory = function(channel_name){
  var channel = new Pusher.Channel(channel_name);
  if(channel_name.indexOf(Pusher.Channel.private_prefix) === 0) {
    Pusher.Util.extend(channel, Pusher.Channel.PrivateChannel);
  } else if(channel_name.indexOf(Pusher.Channel.presence_prefix) === 0) {
    Pusher.Util.extend(channel, Pusher.Channel.PrivateChannel);
    Pusher.Util.extend(channel, Pusher.Channel.PresenceChannel);
  };
  return channel;
};

Pusher.Channel.private_prefix = "private-";
Pusher.Channel.presence_prefix = "presence-";
