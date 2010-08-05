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
    callback({}); // normal channels don't require auth
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
          callback(data);
        } else {
          Pusher.log("Couldn't get auth info from your webapp" + status);
        }
      }
    };
    xhr.send('socket_id=' + encodeURIComponent(pusher.socket_id) + '&channel_name=' + encodeURIComponent(self.name));
  }
};

Pusher.Channel.PresenceChannel = {
  
  init: function(){
    
    this.bind('pusher:subscription_succeeded', function(member_list){
      this.acknowledge_subscription(member_list);
      this.dispatch_with_all('subscription_succeeded', this.members());
    }.scopedTo(this));
    
    this.bind('pusher:member_added', function(member){
      if(this.member_exists(member)) return false;
      this.add_member(member);
      this.dispatch_with_all('member_added', member);
    }.scopedTo(this))
    
    this.bind('pusher:member_removed', function(member){
      this.remove_member(member);
      this.dispatch_with_all('member_removed', member);
    }.scopedTo(this))
  },
  
  disconnect: function(){
    this._members_map = {};
  },
  
  acknowledge_subscription: function(member_list){
    this._members_map = {};
    for(var i=0;i<member_list.length;i++){
      this._members_map[member_list[i].user_id] = member_list[i];
    }
    this.subscribed = true;
  },
  
  member_exists: function(member){
    return (typeof this._members_map[member.user_id] != 'undefined')
  },
  
  is_presence: function(){
    return true;
  },
  
  members: function(){
    var m = [];
    for(var i in this._members_map){
      m.push(this._members_map[i])
    }
    return m;
  },
  
  add_member: function(member){
    this._members_map[member.user_id] = member;
  },
  
  remove_member: function(member){
    delete this._members_map[member.user_id]
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
  channel.init();// inheritable constructor
  return channel;
};

Pusher.Channel.private_prefix = "private-";
Pusher.Channel.presence_prefix = "presence-";
