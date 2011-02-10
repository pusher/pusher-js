/*!
 * Pusher JavaScript Library v1.8.0
 * http://pusherapp.com/
 *
 * Copyright 2010, New Bamboo
 * Released under the MIT licence.
 */

if(typeof Function.prototype.scopedTo == 'undefined'){
  Function.prototype.scopedTo = function(context, args){
    var f = this;
    return function(){
      return f.apply(context, Array.prototype.slice.call(args || [])
        .concat(Array.prototype.slice.call(arguments)));
    };
  };
};

var Pusher = function(application_key, options) {
  this.options = options || {};
  this.path = '/app/' + application_key + "?client=js&version=" + Pusher.VERSION;
  this.key = application_key;
  this.socket_id;
  this.channels = new Pusher.Channels();
  this.global_channel = new Pusher.Channel('pusher_global_channel')
  this.global_channel.global = true;
  this.secure = false;
  this.connected = false;
  this.retry_counter = 0;
  this.encrypted = this.options.encrypted ? true : false;
  if(Pusher.isReady) this.connect();
  Pusher.instances.push(this);

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

Pusher.instances = [];
Pusher.prototype = {
  channel: function(name) {
    return this.channels.find(name);
  },

  connect: function() {
    if (this.encrypted || this.secure) {
      var url = "wss://" + Pusher.host + ":" + Pusher.wss_port + this.path;
    } else {
      var url = "ws://" + Pusher.host + ":" + Pusher.ws_port + this.path;
    }

    Pusher.allow_reconnect = true;
    Pusher.log('Pusher : connecting : ' + url );

    var self = this;

    if (window["WebSocket"]) {
      var ws = new WebSocket(url);

      // Timeout for the connection to handle silently hanging connections
      // Increase the timeout after each retry in case of extreme latencies
      var connectionTimeout = window.setTimeout(function(){
        ws.close();
      }, (2000 + (self.retry_counter * 1000)));

      ws.onmessage = function() {
        self.onmessage.apply(self, arguments);
      };
      ws.onclose = function() {
        window.clearTimeout(connectionTimeout);
        self.onclose.apply(self, arguments);
      };
      ws.onopen = function() {
        window.clearTimeout(connectionTimeout);
        self.onopen.apply(self, arguments);
      };

      this.connection = ws;
    } else {
      // Mock connection object if WebSockets are not available.
      this.connection = {};
      setTimeout(function(){
        self.send_local_event("pusher:connection_failed", {})
      }, 0);
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
    this.retry_counter = 0;
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
    var channel = this.channels.add(channel_name, this);
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

  send_event: function(event_name, data, channel) {
    Pusher.log("Pusher : event sent (channel,event,data) : ", channel, event_name, data);

    var payload = {
      event: event_name,
      data: data
    };
    if (channel) { payload['channel'] = channel };

    this.connection.send(JSON.stringify(payload));
    return this;
  },
  
  send_local_event: function(event_name, event_data, channel_name){
    event_data = Pusher.data_decorator(event_name, event_data);
    if (channel_name) {
      var channel = this.channel(channel_name);
      if (channel) {
        channel.dispatch_with_all(event_name, event_data);
      }
    } else {
      // Bit hacky but these events won't get logged otherwise
      Pusher.log("Pusher : event recd (event,data) :", event_name, event_data);
    }

    this.global_channel.dispatch_with_all(event_name, event_data);
  },
  
  onmessage: function(evt) {
    var params = JSON.parse(evt.data);
    if (params.socket_id && params.socket_id == this.socket_id) return;
    // Try to parse the event data unless it has already been decoded
    if (typeof(params.data) == 'string') {
      params.data = Pusher.parser(params.data);
    }
    // Pusher.log("Pusher : received message : ", params)

    this.send_local_event(params.event, params.data, params.channel);
  },

  reconnect: function() {
    var self = this;
    setTimeout(function() {
      self.connect();
    }, 0);
  },

  retry_connect: function() {
    // Unless we're ssl only, try toggling between ws & wss
    if (!this.encrypted) {
      this.toggle_secure();
    }

    // Retry with increasing delay, with a maximum interval of 10s
    var retry_delay = Math.min(this.retry_counter * 1000, 10000);
    Pusher.log ("Pusher: Retrying connection in " + retry_delay + "ms");
    var self = this;
    setTimeout(function() {
      self.connect();
    }, retry_delay);

    this.retry_counter = this.retry_counter + 1;
  },

  onclose: function() {
    this.global_channel.dispatch('close', null);
    Pusher.log ("Pusher: Socket closed")
    if (this.connected) {
      this.send_local_event("pusher:connection_disconnected", {});
      if (Pusher.allow_reconnect) {
        Pusher.log('Pusher : Connection broken, trying to reconnect');
        this.reconnect();
      }
    } else {
      this.send_local_event("pusher:connection_failed", {});
      this.retry_connect();
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
Pusher.VERSION = "1.8.0";

Pusher.host = "ws.pusherapp.com";
Pusher.ws_port = 80;
Pusher.wss_port = 443;
Pusher.channel_auth_endpoint = '/pusher/auth';
Pusher.log = function(msg){}; // e.g. function(m){console.log(m)}
Pusher.data_decorator = function(event_name, event_data){ return event_data }; // wrap event_data before dispatching
Pusher.allow_reconnect = true;
Pusher.channel_auth_transport = 'ajax';
Pusher.parser = function(data) {
  try {
    return JSON.parse(data);
  } catch(e) {
    Pusher.log("Pusher : data attribute not valid JSON - you may wish to implement your own Pusher.parser");
    return data;
  }
};

Pusher.isReady = false;
Pusher.ready = function () {
  Pusher.isReady = true;
  for(var i = 0; i < Pusher.instances.length; i++) {
    if(!Pusher.instances[i].connected) Pusher.instances[i].connect();
  }
}


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

WEB_SOCKET_SWF_LOCATION = "http://js.pusherapp.com/1.8.0/WebSocketMain.swf";

var _require = (function () {
  
  var handleScriptLoaded;
  if (document.addEventListener) {
    handleScriptLoaded = function (elem, callback) {
      elem.addEventListener('load', callback, false)
    }
  } else {
    handleScriptLoaded = function(elem, callback) {
      elem.attachEvent('onreadystatechange', function () {
        if(elem.readyState == 'loaded' || elem.readyState == 'complete') callback()
      })
    }
  }
  
  return function (deps, callback) {
    var dep_count = 0,
    dep_length = deps.length;

    function checkReady (callback) {
      dep_count++;
      if ( dep_length == dep_count ) {
        // Opera needs the timeout for page initialization weirdness
        setTimeout(callback, 0);
      }
    }

    function addScript (src, callback) {
      callback = callback || function(){}
      var head = document.getElementsByTagName('head')[0];
      var script = document.createElement('script');
      script.setAttribute('src', src);
      script.setAttribute("type","text/javascript");
      script.setAttribute('async', true);

      handleScriptLoaded(script, function () {
        checkReady(callback);
      });

      head.appendChild(script);
    }   

    for(var i = 0; i < dep_length; i++) {
      addScript(deps[i], callback);
    }
  }
})();

;(function() {
  var root = 'http://js.pusherapp.com/1.8.0';
  var deps = [],
      callback = function () {
        Pusher.ready()
      }
  // Check for JSON dependency
  if (window['JSON'] == undefined) {
    deps.push(root + '/json2.js');
  }
  // Check for Flash fallback dep. Wrap initialization.
  if (window['WebSocket'] == undefined) {
    // Don't let WebSockets.js initialize on load. Inconsistent accross browsers.
    window.WEB_SOCKET_DISABLE_AUTO_INITIALIZATION = true;
    deps.push(root + '/flashfallback.js');
    callback = function(){
      FABridge.addInitializationCallback('webSocket', function () {
        Pusher.ready();
      })

      if (window['WebSocket']) {
        // This will call the FABridge callback, which initializes pusher!
        WebSocket.__initialize();
      } else {
        // Flash is not installed
        Pusher.log("Pusher : Could not connect : WebSocket is not availabe natively or via Flash")
        // TODO: Update Pusher state in such a way that users can bind to it
      }
    }
  }
  
  if( deps.length > 0){
    _require(deps, callback);
  } else {
    callback();
  }
})();

