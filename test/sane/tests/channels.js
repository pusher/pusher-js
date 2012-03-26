;(function(context) {
  Tests.addSuite('Pusher.Channel', {
    'Events': {
      'Public Channel': {
        'subscription callback': function(test) {
          Pusher.channel_auth_transport = 'test';
          Pusher.authorizers['test'] = function() {
            callback({});
          };

          var channel = Pusher.Channel.factory('public-channel', {});

          channel.bind('pusher:subscription_succeeded', function() {
            test.equal(channel.subscribed, true, 'Channel should be marked as subscribed after ack');
            test.finish();
          });

          test.equal(channel.subscribed, false, 'Channel should not be marked as subscribed before ack');
          channel.emit('pusher_internal:subscription_succeeded', {});
        }
      },

      'Private Channel': {
        'subscription callback': function(test) {
          Pusher.channel_auth_transport = 'test';
          Pusher.authorizers['test'] = function() {
            callback({});
          };

          var channel = Pusher.Channel.factory('private-channel', {});

          channel.bind('pusher:subscription_succeeded', function() {
            test.equal(channel.subscribed, true, 'Channel should be marked as subscribed after ack');
            test.finish();
          });

          test.equal(channel.subscribed, false, 'Channel should not be marked as subscribed before ack');
          channel.emit('pusher_internal:subscription_succeeded', {});
        }
      },


      'Presence Channel': {
        'subscription callback': function(test) {
          Pusher.channel_auth_transport = 'test';
          Pusher.authorizers['test'] = function() {
            callback({});
          };

          var channel = Pusher.Channel.factory('presence-channel', {});

          channel.bind('pusher:subscription_succeeded', function(members) {
            test.equal(members.count, 1, 'There should be one member');
            test.equal(channel.subscribed, true, 'Channel should be marked as subscribed after ack');
            test.finish();
          });

          test.equal(channel.subscribed, false, 'Channel should not be marked as subscribed before ack');
          channel.emit('pusher_internal:subscription_succeeded', {
            "presence": {
              "count":1,
              "ids":["0a7ffd3af0e34b6acbe42e50b6fc31f1"],
              "hash":{
                "0a7ffd3af0e34b6acbe42e50b6fc31f1":{}
              }
            }
          });
        }
      },

      'Client Trigger': function(test) {
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
      }
    },

    'user_info is sent if specified': function(test) {
      user_id = '123';
      user_info = "g";
      var presenceChannel = Pusher.Channel.factory('presence-woo', {});

      presenceChannel.bind('pusher:member_added', function(member) {
        test.equal(member.info, user_info, "member info should be null");
        test.finish();
      });

      presenceChannel.emit('pusher_internal:member_added', {
        'user_id': user_id,
        'user_info': user_info
      });
    },

    'user_info is optional': function(test) {
      user_id = '123';
      var presenceChannel = Pusher.Channel.factory('presence-woo', {});

      presenceChannel.bind('pusher:member_added', function(member) {
        test.equal(member.info, undefined, "member info should be undefined");
        test.equal(member.id, user_id, "member id should be what was sent");
        test.finish();
      });

      presenceChannel.emit('pusher_internal:member_added', {
        'user_id': user_id
      });
    },

    'trigger() should return false if not connected': function(test) {
      test.numAssertions = 1;

      var pusher = new Pusher('testing');
      var channel = pusher.subscribe('foo');
      // stop the initial connection attempt.
      pusher.disconnect();
      // Override the state machine, as trigger only checks
      // the value of the machine state.
      pusher.connection._machine.state = 'permanentlyClosed';
      pusher.connection.socket = new TestSocket()

      test.equal(channel.trigger('foo', 'bar'), false, 'channel.trigger should return false.');
      test.finish();
    },

    'trigger() should return true if connected': function(test) {
      test.numAssertions = 1;

      var pusher = new Pusher('testing');
      var channel = pusher.subscribe('foo');
      // stop the initial connection attempt.
      pusher.disconnect();
      // Override the state machine, as trigger only checks
      // the value of the machine state.
      pusher.connection._machine.state = 'connected';
      pusher.connection.socket = new TestSocket()

      test.equal(channel.trigger('foo', 'bar'), true, 'channel.trigger should return true.');
      test.finish();
    }
  });
})(this);
