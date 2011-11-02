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
  },

  disconnect: function () {
    for(var channel_name in this.channels){
      this.channels[channel_name].disconnect()
    }
  }
};

Pusher.Channel = function(channel_name, pusher) {
  Pusher.EventsDispatcher.call(this);

  this.pusher = pusher;
  this.name = channel_name;
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

  is_private: function(){
    return false;
  },

  is_presence: function(){
    return false;
  },

  authorize: function(pusher, callback){
    callback(false, {}); // normal channels don't require auth
  },

  trigger: function(event, data) {
    this.pusher.send_event(event, data, this.name);
    return this;
  }
};

Pusher.Util.extend(Pusher.Channel.prototype, Pusher.EventsDispatcher.prototype);



Pusher.auth_callbacks = {};

Pusher.authorizers = {
  ajax: function(pusher, callback){
    var self = this, xhr;

    if (Pusher.XHR) {
      xhr = new Pusher.XHR();
    } else {
      xhr = (window.XMLHttpRequest ? new window.XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"));
    }

    xhr.open("POST", Pusher.channel_auth_endpoint, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          var data, parsed = false;

          try {
            data = JSON.parse(xhr.responseText);
            parsed = true;
          } catch (e) {
            callback(true, 'JSON returned from webapp was invalid, yet status code was 200. Data was: ' + xhr.responseText);
          }

          if (parsed) { // prevents double execution.
            callback(false, data);
          }
        } else {
          Pusher.debug("Couldn't get auth info from your webapp", status);
          callback(true, xhr.status);
        }
      }
    };
    xhr.send('socket_id=' + encodeURIComponent(pusher.connection.socket_id) + '&channel_name=' + encodeURIComponent(self.name));
  },
  jsonp: function(pusher, callback){
    var qstring = 'socket_id=' + encodeURIComponent(pusher.connection.socket_id) + '&channel_name=' + encodeURIComponent(this.name);
    var script = document.createElement("script");
    // Hacked wrapper.
    Pusher.auth_callbacks[this.name] = function(data) {
      callback(false, data);
    };
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
      if (member) {
        this.dispatch_with_all('pusher:member_removed', member);
      }
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
      var member = this.get(user_id);
      if (member) {
        delete this._members_map[user_id];
        this.count--;
      }
      return member;
    },

    get: function(user_id) {
      if (this._members_map.hasOwnProperty(user_id)) { // have heard of this user user_id
        return {
          id: user_id,
          info: this._members_map[user_id]
        }
      } else { // have never heard of this user
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
