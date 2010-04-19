// Ismael Celis 2010
/* Usage
-----------------------------------*/
// var socket = new Pusher('some_channel', 'some_user_token');
//  
// // Bind to custom events emitted by the server
// // You can bind more than one handler to the same event. Handlers will be run in the order you registered them.
// socket.bind('some_custom_event', function(data){
//   // jquery example here.
//   // data is any data you broadcast to open sockets from the server. It can be jSon.
//   $('div#content').append("<p>" + data.name + "</p>");
// });
//  
// // Bind to standard WebSocket events in the same way
// socket.bind('close', function('close', function(){ alert('Socket closed!') });
//  
// // You can also send events to all clients if the server supports multicasting.
// // This keeps event semantics and you can send custom events
// socket.trigger('message_received', {'user' : 'Ismael'});
 
/* The code
-----------------------------------*/
var Pusher = function(application_key, channel){
  var URL = 'ws://' + Pusher.host + '/app/' + application_key + "?channel=" + channel;
  var conn;
  var self = this;
  this.socket_id;
  
  var connect = function(){
    conn = new WebSocket(URL);
  };
  
  if (window["WebSocket"]) {
    connect()
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
  
  this.trigger = function(event_name, data){
    var payload = JSON.stringify({'event' : event_name, 'data' : data});
    Pusher.log(payload);
    conn.send(payload);
    return this;
  };
  
  this.send = function(msg){
    return this.trigger('message', msg);
  };
  
  // dispatch to the right handler
  // Expects socket data as json array in the format:
  // ['Socket-some_message_name', {'my_own_data' : 'blah'}]
  // The first element must be a hyphenated event name. The second one is your custom data
  conn.onmessage = function(evt){
    var params = JSON.parse(evt.data);
    if (params.socket_id && params.socket_id == self.socket_id) return;
    var event_name = params.event;
    dispatch_global_callbacks(event_name, params.data);
    dispatch(event_name, params.data);
  };
  
  // Reconnect on close
  conn.onclose = function(){
    dispatch('close',null);
    if(Pusher.allow_reconnect){
      Pusher.log('Socket closed. Reconnecting in 5 seconds...');
      setTimeout(function(){
        Pusher.log('Reconnecting');
        connect()
      }, 5000);
    }
  }
  conn.onopen = function(){dispatch('open',null)}
  
  var dispatch = function(event_name, raw_message){
    var message = Pusher.parser(raw_message);
    Pusher.log("Pusher : event received : " + event_name + " : " + message);
    var chain = callbacks[event_name];
    if(typeof chain == 'undefined'){
      Pusher.log('No callbacks for '+event_name);
      return;
    }
    for(var i=0;i<chain.length;i++){
      chain[i](message)
    }
  };
  
  var dispatch_global_callbacks = function(event_name, message){
    for(var i=0;i<global_callbacks.length;i++){
      global_callbacks[i](event_name, message)
    }
  };
  
  // Bind ourselves to pusher_errors
  this.bind('pusher_error', function(data){
    Pusher.log("PUSHER ERROR: " + data + ' ::::::::::::::::::::')
  });
  
  this.bind('connection_established', function(data){
    self.socket_id = data.socket_id
  });
};

// Defaults ::::::::::::
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
