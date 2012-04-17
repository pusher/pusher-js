;(function(context) {
  var makeAuthorizer = function(options) {
    return new Pusher.Channel.Authorizer(Pusher.Channel.factory('woo', {}),
                                         "ajax",
                                         options);
  };

  var PusherMock = {
    connection: {
      socket_id: 1234.1234
    }
  };

  Tests.addSuite('Pusher.Channel.Authorizer', {
    'composeQuery': {
      'should return str with just socket id and channel name if no auth query options': function(test) {
        test.equal(makeAuthorizer({}).composeQuery("1.1"), "&socket_id=1.1&channel_name=woo");
        test.finish();
      },

      'should add query params specified in options object': function(test) {
        var authorizer = makeAuthorizer({
          auth: {
            params: { a: 1, b: 2 }
          }
        });
        test.equal(authorizer.composeQuery("1.1"), "&socket_id=1.1&channel_name=woo&a=1&b=2");
        test.finish();
      }
    },

    'subscribe': {
      'should pass global auth options to authorizer': function(test) {
        Pusher.XHR = context.TestXHR;
        var options = { auth: { headers: { }, params: { } } };
        var channelName = "private-foo";

        var pusher = new Pusher('b599fe0f1e4b6f6eb8a6', options);
        pusher.connection.state = "connected"; // hack connected state so subscribe() will call authorize
        var channel = pusher.channels.add(channelName, pusher); // artifically add to channel list

        // rewrite authorize fn so we can check passed args
        channel.authorize = function(socketId, options, callback) {
          test.deepEqual(options.auth, options.auth);
          test.finish();
        };

        var channel = pusher.subscribe(channelName);
      }
    },

    'ajax authorizer': {
      'invalid JSON in xhr.responseText results in Error': function(test) {
        test.numAssertions = 2;

        var invalidJSON = 'ERROR INVALID JSON {"msg":"Goodnight from me. And goodnight from him."}';

        Pusher.channel_auth_transport = 'ajax';
        Pusher.XHR = context.TestXHR;

        var channel = Pusher.Channel.factory('private-channel', PusherMock);
        channel.authorize(PusherMock.connection.socket_id, {}, function(err, data) {

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

        Pusher.channel_auth_transport = 'ajax';
        Pusher.XHR = context.TestXHR;

        var channel = Pusher.Channel.factory('private-channel', PusherMock);
        channel.authorize(PusherMock.connection.socket_id, {}, function(err, data) {

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
      },

      'should add headers in options to request': function(test) {
        var options = { auth: { headers: { "a": 1, "b": 2 } } };
        Pusher.channel_auth_transport = 'ajax';
        Pusher.XHR = context.TestXHR;

        var channel = Pusher.Channel.factory('private-channel', PusherMock);
        var xhr = channel.authorize(PusherMock.connection.socket_id, options, function(err, data) {
          for(var i in options.auth.headers) {
            test.equal(xhr._args.headers[i], options.auth.headers[i]);
          }
          test.finish();
        });

        var XHR = TestXHR.lastInstance();

        XHR.trigger('DONE', {
          responseText: JSON.stringify({"auth":"278d425bdf160c739803:a99e78e7cd40dcd0d4ae06be0a5395b6cd3c085764229fd40b39ce92c39af33e"}),
          status: 200
        });
      },

      'should add params in options to request query string': function(test) {
        var options = { auth: { params: { "a": 1, "b": 2 } } };
        Pusher.channel_auth_transport = 'ajax';
        Pusher.XHR = context.TestXHR;

        var channel = Pusher.Channel.factory('private-channel', PusherMock);
        var xhr = channel.authorize(PusherMock.connection.socket_id, options, function(err, data) {
          test.equal(xhr._args.send[0], "&socket_id=1234.1234&channel_name=private-channel&a=1&b=2");
          test.finish();
        });

        var XHR = TestXHR.lastInstance();

        XHR.trigger('DONE', {
          responseText: JSON.stringify({"auth":"278d425bdf160c739803:a99e78e7cd40dcd0d4ae06be0a5395b6cd3c085764229fd40b39ce92c39af33e"}),
          status: 200
        });
      }
    },

    'jsonp authorizer': {
      'if options contain auth headers, print warning': function(test) {
        var logs = new mock.log.LogMock();
        Pusher.channel_auth_transport = 'jsonp';
        Pusher.channel_auth_endpoint = '//:la'; // will avoid GET req failure
        var options = { auth: { headers: { "a": "b" } } };

        var channel = Pusher.Channel.factory('private-channel', PusherMock);
        channel.authorize(PusherMock.connection.socket_id, options);

        test.equal(logs.messages["Warn"][0],
                   "Pusher : Warn : To send headers with the auth request, you must use AJAX, rather than JSONP.");
        test.finish();
      }
    }
  });
})(this);
