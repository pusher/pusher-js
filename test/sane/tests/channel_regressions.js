;(function() {
  Tests.addSuite('Pusher.ChannelRegressions', {
    'get TypeError if try to bind to even w/ same name as built in JS obj fn': function(test) {
      var channel = Pusher.Channel.factory('public-channel', {});
      channel.bind('toString', function() {
        // if we get here, the event was bound to and
        // the event emission triggered the callback
        test.finish();
      });

      channel.emit('toString');
    },
  })
}).call(this);
