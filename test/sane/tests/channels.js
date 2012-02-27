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
    },

    'Authorizers': {
      'invalid JSON in xhr.responseText results in Error': function(test) {
        test.numAssertions = 2;

        var invalidJSON = 'ERROR INVALID JSON {"msg":"Goodnight from me. And goodnight from him."}';

        var PusherMock = {
          connection: {
            socket_id: 1234.1234
          }
        };

        Pusher.channel_auth_transport = 'ajax';
        Pusher.XHR = context.TestXHR;

        var channel = Pusher.Channel.factory('private-channel', PusherMock);
        channel.authorize(PusherMock, function(err, data) {

          test.equal(
            err, true,
           'callback argument `err` should be true.'
          );

          test.equal(
            data,
            'JSON returned from webapp was invalid, yet status code was 200. Data was: ' + invalidJSON,
            'callback argument `data` should be a message indicating the error.'
          );

          test.finish();
        });

        var XHR = TestXHR.lastInstance();

        XHR.trigger('DONE', {
          responseText: invalidJSON,
          status: 200
        });
      },

      'valid JSON in xhr.responseText results in Success': function(test) {
        test.numAssertions = 2;

        var authResult = {"auth":"278d425bdf160c739803:a99e78e7cd40dcd0d4ae06be0a5395b6cd3c085764229fd40b39ce92c39af33e"};
        var validJSON = JSON.stringify(authResult);

        var PusherMock = {
          connection: {
            socket_id: 1234.1234
          }
        };

        Pusher.channel_auth_transport = 'ajax';
        Pusher.XHR = context.TestXHR;

        var channel = Pusher.Channel.factory('private-channel', PusherMock);
        channel.authorize(PusherMock, function(err, data) {

          test.equal(
            err, false,
           'callback argument `err` should be false.'
          );

          test.deepEqual(
            data, authResult,
            'callback argument `data` should be an object of the authResult.'
          );

          test.finish();
        });

        var XHR = TestXHR.lastInstance();

        XHR.trigger('DONE', {
          responseText: validJSON,
          status: 200
        });
      }
    }
  });
})(this);
