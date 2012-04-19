;(function() {
  Tests.addSuite('Pusher.Connection message sending', {
    'should emit the "message" event on the receive of a valid websocket message': function(test) {
      Pusher.Transport = TestSocket;

      var connection = new Pusher.Connection('b599fe0f1e4b6f6eb8a6');

      SteppedObserver(connection._machine, 'state_change', [
        // waiting
        function(e) {},
        // connecting
        function(e) {
          connection.socket.trigger('open');
        },
        // open
        function(e) {
          connection.socket.trigger('message', JSON.stringify({
            event: 'pusher:connection_established',
            data: '{\"socket_id\":\"804.1456320\"}'
          }));
        },
        // connected
        function() {
          var testMessage = {
            event: 'chat-message',
            channel: 'my-awesome-chat-channel',
            data: { message: 'oh awesome' }
          };

          // best to bind directly as connection.socket.trigger is async.
          connection.bind('message', function(event) {
            test.deepEqual(event, testMessage, 'Should receive an exact copy of the sent message.');
            test.finish();
          });

          connection.socket.trigger('message', JSON.stringify({
            event: 'chat-message',
            channel: 'my-awesome-chat-channel',
            data: '{"message":"oh awesome"}'
          }));
        }
      ]);

      connection.connect();
    },

    'should emit the "error" event on the receive of a invalid websocket message': function(test) {
      Pusher.Transport = TestSocket;

      var connection = new Pusher.Connection('b599fe0f1e4b6f6eb8a6');

      SteppedObserver(connection._machine, 'state_change', [
        // waiting
        function(e) {},
        // connecting
        function(e) {
          connection.socket.trigger('open');
        },
        // open
        function(e) {
          connection.socket.trigger('message', JSON.stringify({
            event: 'pusher:connection_established',
            data: '{\"socket_id\":\"804.1456320\"}'
          }));
        },
        // connected
        function() {
          // note: the data property is an invalid JSON string.
          var payload = 'invalid';

          // best to bind directly as connection.socket.trigger is async.
          connection.bind('error', function(event) {
            test.equal(event.type, 'MessageParseError', 'The error type should be set to "MessageParseError"');
            test.equal(event.data, payload, 'The payload should remain unchanged');
            test.finish();
          });

          connection.socket.trigger('message', payload);
        }
      ]);

      connection.connect();
    },

    'Should be able to send a message and know if it was sent': function(test) {
      Pusher.Transport = TestSocket;

      var connection = new Pusher.Connection('b599fe0f1e4b6f6eb8a6');
      var payload = JSON.stringify({
        event: 'chat-message',
        channel: 'my-awesome-chat-channel',
        data: '{"message":"oh awesome"}'
      });

      SteppedObserver(connection._machine, 'state_change', [
        // waiting
        function(e) {},
        // connecting
        function(e) {
          connection.socket.trigger('open');
        },
        // open
        function(e) {
          connection.socket.trigger('message', JSON.stringify({
            event: 'pusher:connection_established',
            data: '{\"socket_id\":\"804.1456320\"}'
          }));
        },
        // connected
        function() {
          test.equal(connection.send(payload), true, 'connection.send should return true if connected');

          // send happens in timeout, so must wait for it to occur
          setTimeout(function() {
            test.equal(connection.socket._sendQueue.length, 1, 'connection.socket should have one message queued for sending');
          }, 0);

          test.finish();
        }
      ]);

      // Try and send a message while not connected.
      test.equal(connection.send(payload), false, 'connection.send should return false if not connected');

      // Connect the socket to continue the tests.
      connection.connect();
    },

    'Should not get InvalidStateError if try to send message on connection still connecting': function(test) {
      // quick test that raw TestSocket will emit InvalidStateError if send on connecting
      var caughtRawTestSocketException = false;
      try {
        new TestSocket("ws://whatever").send("la");
      }
      catch(e) {
        test.equal(e.name, "InvalidStateError");
        caughtRawTestSocketException = true;
      }

      // now for the real test with the TestSocket used by Pusher.Connection
      Pusher.Transport = TestSocket;
      var connection = new Pusher.Connection('ab');
      SteppedObserver(connection._machine, 'state_change', [
        function(e) {}, // waiting
        function(e) { // connecting
          test.equal(connection.send("{}"), false);
          test.equal(connection.state, "connecting"); // conn should not be closed
          if(caughtRawTestSocketException) {
            test.finish();
          }
        },
      ]);

      // Connect the socket to continue the tests.
      connection.connect();
    }
  })
})();