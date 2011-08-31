;(function() {
  runner.addSuite('Pusher.Channel', {
    'Trigger client-event': function(test) {
      test.numAssertions = 3;

      var PusherMock = {
        send_event: function(name, data, channel) {
          test.equal('client-foo', name, 'Event names should be equal');
          test.deepEqual({'bar': 'baz'}, data, 'Event data should be sent');
          test.equal('clientEvents', channel, 'The channel name should be auto-populated');
        }
      };

      Pusher.channel_auth_transport = 'test';
      Pusher.authorizers['test'] = function() {
        callback({});
      };

      var channel = Pusher.Channel.factory('clientEvents', PusherMock);

      channel.trigger('client-foo', {'bar': 'baz'});
      test.finish();
    },

    'user_info is sent if specified': function(test) {
      user_id = '123';
      user_info = "g";
      var presenceChannel = Pusher.Channel.factory('presence-woo', {});

      presenceChannel.bind('pusher:member_added', function(member) {
        test.equal(member.info, user_info, "member info should be null");
        test.finish();
      });

      presenceChannel.dispatch('pusher_internal:member_added', {
        'user_id': user_id,
        'user_info': user_info
      });
    },

    'user_info is optional': function(test) {
      user_id = '123';
      var presenceChannel = Pusher.Channel.factory('presence-woo', {});

      presenceChannel.bind('pusher:member_added', function(member) {
        test.equal(member.info, null, "member info should be null");
        test.equal(member.id, user_id, "member id should be what was sent");
        test.finish();
      });

      presenceChannel.dispatch('pusher_internal:member_added', {
        'user_id': user_id
      });
    }
  });
})();