/*!
 * Pusher JavaScript Library v1.1
 * http://pusherapp.com/
 *
 * Copyright 2010, New Bamboo
 * Released under the MIT licence.
 */
var Pusher = function(application_key, channel){
  var URL = 'ws://' + Pusher.host + '/app/' + application_key + "?channel=" + channel;
  var conn;
  var self = this;
  this.socket_id;
  
  var connect = function(){
    conn = new WebSocket(URL);
  };
  
  if (window["WebSocket"]) {
    connect();
  } else {
    // Mock connection object if WebSockets are not available.
    conn = {};
  }

  var callbacks = {};
  
  var global_callbacks = [];
  
  this.bind = function(event_name, callback){
    callbacks[event_name] = callbacks[event_name] || [];
    callbacks[event_name].push(callback);
    return this;//chainable
  };
  
  this.bind_all = function(callback){
    global_callbacks.push(callback);
  };
  
  // Not currently supported by pusherapp.com
  this.trigger = function(event_name, data){
    var payload = JSON.stringify({'event' : event_name, 'data' : data});
    Pusher.log("Pusher : sending event : " + payload);
    conn.send(payload);
    return this;
  };
  
  this.send = function(msg){
    return this.trigger('message', msg);
  };

  conn.onmessage = function(evt){
    var params = JSON.parse(evt.data);
    if (params.socket_id && params.socket_id == self.socket_id) return;
    var event_name = params.event;
    var event_data = Pusher.parser(params.data);
    Pusher.log("Pusher : event received : " + event_name +" : "+ event_data);
    dispatch_global_callbacks(event_name, event_data);
    dispatch(event_name, event_data);
  };

  conn.onclose = function(){
    dispatch('close',null);
    if(Pusher.allow_reconnect){
      Pusher.log('Pusher : socket closed : Reconnecting in 5 seconds...');
      setTimeout(function(){
        Pusher.log('Pusher :: reconnecting');
        connect();
      }, 5000);
    }
  };
  conn.onopen = function(){dispatch('open',null);};
  
  var dispatch = function(event_name, event_data){
    var chain = callbacks[event_name];
    if(typeof chain == 'undefined'){
      Pusher.log('Pusher : No callbacks for '+event_name);
      return;
    }
    for(var i=0;i<chain.length;i++){
      chain[i](event_data);
    }
  };
  
  var dispatch_global_callbacks = function(event_name, event_data){
    for(var i=0;i<global_callbacks.length;i++){
      global_callbacks[i](event_name, event_data);
    }
  };

  this.bind('connection_established', function(data){
    self.socket_id = data.socket_id;
  });
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
