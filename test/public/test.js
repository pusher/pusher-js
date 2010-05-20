Pusher.log = function() {
  if (window.console) console.log.apply(console, arguments)
}

WebSocket.__swfLocation = "/WebSocketMain.swf"

var testTimeout = 10000
var clientID = parseInt(Math.random() * 1000000)
var pusherAsyncTimeout = 2000;
var pusherKey = ""
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

function pusherTest(description, expected, callback) {
  test(description, function() {
    stop(testTimeout)
    var pusher = new Pusher(pusherKey)
    onPusherReady(pusher, callback)
  })
}

asyncTest("should subscribe to the given channel on initialization", 1, function() {
  var channel = nextChannel()
  var pusher = new Pusher(pusherKey, channel)

  onPusherReady(pusher, function() {
    pusher.channel(channel).bind("test_event", function(data) {
      same(data, "data")
      start()
    });

    trigger(channel, "test_event", "data")
  })
})

pusherTest("should receive events from a subscribed channel", 1, function(pusher, channel) {
  pusher.subscribe(channel).bind("test_event", function(data) {
    same(data, "data")
    start()
  });

  trigger(channel, "test_event", "data")
})

pusherTest("should not trigger events for channels which we aren't subscribed to", 1, function(pusher, channel) {
  var eventCalled = false

  pusher.subscribe(channel).bind("test_event", function() {
    eventCalled = true
  });

  pusher.unsubscribe(channel)

  trigger(channel, "test_event", "data")

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

  trigger(channel, "test_event", "data")
  trigger(anotherChannel, "test_event", "data")

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

  trigger(channel, "test_event", "data")
  trigger(anotherChannel, "test_event", "data")

  setTimeout(function() {
    ok(channelEventCalled)
    ok(anotherChannelEventCalled)
    start()
  }, pusherAsyncTimeout);
})
