Pusher.Channels = function(channel_name) {
  this.channels = [channel_name];
};

Pusher.Channels.prototype = {
  add: function(channel_name) {
    if (!this.includes(channel_name)) {
      this.channels.push(channel_name);
    }
  },
  
  includes: function(channel_name) {
    for (var i = 0; i < this.channels.length; i++) {
      if (this.channels[i] === channel_name) return true;
    }
    return false;
  },
  
  remove: function(channel_name) {
    for (var i = 0; i < this.channels.length; i++) {
      if (this.channels[i] === channel_name) {
        this.channels.splice(i, 1);
        break;
      };
    }
  }
};
