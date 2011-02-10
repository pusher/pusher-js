Pusher.Channels = function() {
  this.channels = {};
};

Pusher.Channels.prototype = {
  add: function(channel_name, pusher) {
    var existing_channel = this.find(channel_name);
    if (!existing_channel) {
      var channel = Pusher.Channel.factory(channel_name, pusher);
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

Pusher.Channel = function(channel_name, pusher) {
  this.pusher = pusher;
  this.name = channel_name;
  this.callbacks = {};
  this.global_callbacks = [];
  this.subscribed = false;
};

Pusher.Channel.prototype = {
  // inheritable constructor
  init: function(){
    
  },
  
  disconnect: function(){
    
  },
  
  // Activate after successful subscription. Called on top-level pusher:subscription_succeeded
  acknowledge_subscription: function(data){
    this.subscribed = true;
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

  trigger: function(event_name, data) {
    this.pusher.send_event(event_name, data, this.name);
    return this;
  },

  dispatch_with_all: function(event_name, data) {
    if (this.name != 'pusher_global_channel') {
      Pusher.log("Pusher : event recd (channel,event,data)", this.name, event_name, data);
    }
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
    callback({}); // normal channels don't require auth
  }
};


Pusher.auth_callbacks = {};

Pusher.authorizers = {
  ajax: function(pusher, callback){
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
          callback(data);
        } else {
          Pusher.log("Couldn't get auth info from your webapp" + status);
        }
      }
    };
    xhr.send('socket_id=' + encodeURIComponent(pusher.socket_id) + '&channel_name=' + encodeURIComponent(self.name));
  },
  jsonp: function(pusher, callback){
    var qstring = 'socket_id=' + encodeURIComponent(pusher.socket_id) + '&channel_name=' + encodeURIComponent(this.name);
    var script = document.createElement("script");  
    Pusher.auth_callbacks[this.name] = callback;
    var callback_name = "Pusher.auth_callbacks['" + this.name + "']";
    script.src = Pusher.channel_auth_endpoint+'?callback='+encodeURIComponent(callback_name)+'&'+qstring;
    var head = document.getElementsByTagName("head")[0] || document.documentElement;
    head.insertBefore( script, head.firstChild );
  }
};

Pusher.Channel.PrivateChannel = {
  is_private: function(){
    return true;
  },
  
  authorize: function(pusher, callback){
    Pusher.authorizers[Pusher.channel_auth_transport].scopedTo(this)(pusher, callback);
  }
};

Pusher.Channel.PresenceChannel = {
  
  init: function(){
    this.bind('pusher_internal:subscription_succeeded', function(sub_data){
      this.acknowledge_subscription(sub_data);
      this.dispatch_with_all('pusher:subscription_succeeded', this.members);
    }.scopedTo(this));
    
    this.bind('pusher_internal:member_added', function(data){
      var member = this.members.add(data.user_id, data.user_info);
      this.dispatch_with_all('pusher:member_added', member);
    }.scopedTo(this))
    
    this.bind('pusher_internal:member_removed', function(data){
      var member = this.members.remove(data.user_id);
      this.dispatch_with_all('pusher:member_removed', member);
    }.scopedTo(this))
  },
  
  disconnect: function(){
    this.members.clear();
  },
  
  acknowledge_subscription: function(sub_data){
    this.members._members_map = sub_data.presence.hash;
    this.members.count = sub_data.presence.count;
    this.subscribed = true;
  },
  
  is_presence: function(){
    return true;
  },
  
  members: {
    _members_map: {},
    count: 0,

    each: function(callback) {
      for(var i in this._members_map) {
        callback({
          id: i,
          info: this._members_map[i]
        });
      }
    },

    add: function(id, info) {
      this._members_map[id] = info;
      this.count++;
      return this.get(id);
    },

    remove: function(user_id) {
      member = this.get(user_id);
      delete this._members_map[user_id];
      this.count--;
      return member;
    },

    get: function(user_id) {
      var user_info = this._members_map[user_id];
      if (user_info) {
        return {
          id: user_id,
          info: user_info
        }
      } else {
        return null;
      }
    },

    clear: function() {
      this._members_map = {};
      this.count = 0;
    }
  }
};

Pusher.Channel.factory = function(channel_name, pusher){
  var channel = new Pusher.Channel(channel_name, pusher);
  if(channel_name.indexOf(Pusher.Channel.private_prefix) === 0) {
    Pusher.Util.extend(channel, Pusher.Channel.PrivateChannel);
  } else if(channel_name.indexOf(Pusher.Channel.presence_prefix) === 0) {
    Pusher.Util.extend(channel, Pusher.Channel.PrivateChannel);
    Pusher.Util.extend(channel, Pusher.Channel.PresenceChannel);
  };
  channel.init();// inheritable constructor
  return channel;
};

Pusher.Channel.private_prefix = "private-";
Pusher.Channel.presence_prefix = "presence-";
