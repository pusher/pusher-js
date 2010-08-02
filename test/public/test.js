Pusher.allow_reconnect = false
Pusher.log = function() {
  if (window.console) console.log.apply(console, arguments)
}

WebSocket.__swfLocation = "/WebSocketMain.swf"

var testTimeout = 40000
var clientID = parseInt(Math.random() * 1000000)
var pusherAsyncTimeout = 40000;
var channelCount = 0

function nextChannel() {
  return "test-channel-" + clientID + '-' + channelCount++
}

function onPusherReady(pusher, callback) {
  pusher.bind("connection_established", function() {
    callback(pusher, nextChannel())
  })
}

function trigger(channel, event, data, socket_id) {
  $.post("/trigger", {
    channel: channel,
    event: event,
    data: data,
    socket_id: socket_id
  })
}

function disconnect(pusher) {
  setTimeout(function() {
    pusher.disconnect()
  }, testTimeout)
}

function pusherTest(description, expected, callback) {
  test(description, function() {
    stop(testTimeout)
    var pusher = new Pusher(pusherKey)
    onPusherReady(pusher, callback)
    disconnect(pusher)
  })
}

asyncTest("should subscribe to the given channel on initialization", 1, function() {
  var channel = nextChannel()
  var pusher = new Pusher(pusherKey, channel)

  onPusherReady(pusher, function() {
    pusher.channel(channel).bind("test_event", function(data) {
      same(data, { some: "data" })
      start()
    });

    trigger(channel, "test_event", { some: "data" })
  })

  disconnect(pusher)
})

pusherTest("should receive events from a subscribed channel", 1, function(pusher, channel) {
  pusher.subscribe(channel).bind("test_event", function(data) {
    same(data, { some: "data" })
    start()
  });

  trigger(channel, "test_event", { some: "data" })
})

pusherTest("should not trigger events for channels which we aren't subscribed to", 1, function(pusher, channel) {
  var eventCalled = false

  pusher.subscribe(channel).bind("test_event", function() {
    eventCalled = true
  });

  pusher.unsubscribe(channel)

  trigger(channel, "test_event", { some: "data" })

  setTimeout(function() {
    ok(!eventCalled)
    start()
  }, pusherAsyncTimeout);
})

pusherTest("should only trigger events for channels which we are subscribed to", 1, function(pusher, channel) {
  var anotherChannel = nextChannel()
  var eventChannels = []

  pusher.subscribe(channel).bind("test_event", function() {
    eventChannels.push(channel)
  });
  pusher.subscribe(anotherChannel).bind("test_event", function() {
    eventChannels.push(anotherChannel)
  });

  pusher.unsubscribe(channel)

  trigger(channel, "test_event", { some: "data" })
  trigger(anotherChannel, "test_event", { some: "data" })

  setTimeout(function() {
    same(eventChannels, [anotherChannel])
    start()
  }, pusherAsyncTimeout);
})

pusherTest("should trigger events for all channels which we are subscribed to", 2, function(pusher, channel) {
  var anotherChannel = nextChannel()
  var channelEventCalled = false
  var anotherChannelEventCalled = false

  pusher.subscribe(channel).bind("test_event", function() {
    channelEventCalled = true
  });
  pusher.subscribe(anotherChannel).bind("test_event", function() {
    anotherChannelEventCalled = true
  });

  trigger(channel, "test_event", { some: "data" })
  trigger(anotherChannel, "test_event", { some: "data" })

  setTimeout(function() {
    ok(channelEventCalled)
    ok(anotherChannelEventCalled)
    start()
  }, pusherAsyncTimeout);
})

pusherTest("should wrap event data if Pusher.data_wrapper is defined", 1, function(pusher, channel) {
  var Wrap = function(data){
    this.event_data = data;
  };
  
  Pusher.data_decorator = function(event_name, event_data){
    if(event_name == 'wrapped_event') return new Wrap(event_data)
    else return event_data;
  };
  
  pusher.subscribe(channel).bind("wrapped_event", function(wrapped_data_object) {
    same(wrapped_data_object.event_data, { some: "data" })
    start()
  });

  trigger(channel, "wrapped_event", { some: "data" })
})

/* Private channels :::::::::::::::::::::::::::::::: */
pusherTest("should subscribe to private channels", 1, function(pusher, channel) {
  pusher.subscribe('private-succesful_auth').bind("test_event", function(data) {
    same(data, { some: "private data" })
    start()
  });

  trigger('private-succesful_auth', "test_event", { some: "private data" })
})

pusherTest("should trigger failed authentication for private channels", 1, function(pusher, channel) {
  failed_channel = pusher.subscribe('private-failed_auth');
  failed_channel.bind('pusher:auth_errors', function(){
    ok(true, 'Got error event')
  });

  trigger('private-failed_auth', "test_event", { some: "private data" })
})

