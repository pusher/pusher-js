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
  var self = this;
  Pusher.EventsDispatcher.call(this, function(event_name, event_data) {
    Pusher.debug('No callbacks on ' + channel_name + ' for ' + event_name);
  });

  this.pusher = pusher;
  this.name = channel_name;
  this.subscribed = false;

  this.bind('pusher_internal:subscription_succeeded', function(data) {
    self.onSubscriptionSucceeded(data);
  });
};

Pusher.Channel.prototype = {
  // inheritable constructor
  init: function() {},
  disconnect: function() {},

  onSubscriptionSucceeded: function(data) {
    this.subscribed = true;
    this.emit('pusher:subscription_succeeded');
  },

  authorize: function(socketId, options, callback){
    return callback(false, {}); // normal channels don't require auth
  },

  trigger: function(event, data) {
    return this.pusher.send_event(event, data, this.name);
  }
};

Pusher.Util.extend(Pusher.Channel.prototype, Pusher.EventsDispatcher.prototype);

Pusher.Channel.PrivateChannel = {
  authorize: function(socketId, options, callback){
    var authorizer = new Pusher.Channel.Authorizer(this, Pusher.channel_auth_transport, options);
    return authorizer.authorize(socketId, callback);
  }
};

Pusher.Channel.PresenceChannel = {
  init: function(){
    this.bind('pusher_internal:member_added', function(data){
      var member = this.members.add(data.user_id, data.user_info);
      this.emit('pusher:member_added', member);
    }.scopedTo(this))

    this.bind('pusher_internal:member_removed', function(data){
      var member = this.members.remove(data.user_id);
      if (member) {
        this.emit('pusher:member_removed', member);
      }
    }.scopedTo(this))
  },

  disconnect: function(){
    this.members.clear();
  },

  onSubscriptionSucceeded: function(data) {
    this.members._members_map = data.presence.hash;
    this.members.count = data.presence.count;
    this.subscribed = true;

    this.emit('pusher:subscription_succeeded', this.members);
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
  if (channel_name.indexOf('private-') === 0) {
    Pusher.Util.extend(channel, Pusher.Channel.PrivateChannel);
  } else if (channel_name.indexOf('presence-') === 0) {
    Pusher.Util.extend(channel, Pusher.Channel.PrivateChannel);
    Pusher.Util.extend(channel, Pusher.Channel.PresenceChannel);
  };
  channel.init();
  return channel;
};
