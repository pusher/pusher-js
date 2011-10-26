;(function(context) {
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
        context.XMLHttpRequest = context.TestXHR;

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

          context.XMLHttpRequest = context.TestXHR.original;
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
        context.XMLHttpRequest = context.TestXHR;

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

          context.XMLHttpRequest = context.TestXHR.original;
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