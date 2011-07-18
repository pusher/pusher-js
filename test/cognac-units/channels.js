;(function() {
  runner.addSuite('Pusher.Channel', {
    'Trigger client-event': function(test) {
      test.numAssertions = 3;
      
      var PusherMock = {
        send_event: function(name, data, channel) {
          test.equal('foo', name, 'Event names should be equal');
          test.deepEqual({'bar': 'baz'}, data, 'Event data should be sent');
          test.equal('clientEvents', channel, 'The channel name should be auto-populated');
        }
      };

      Pusher.channel_auth_transport = 'test';
      Pusher.authorizers['test'] = function() {
        callback({});
      };

      var channel = Pusher.Channel.factory('clientEvents', PusherMock);
      
      channel.trigger('foo', {'bar': 'baz'});
      test.finish();
    }

  });
})();