;(function() {
  var withConnectedConnection = function(test, options, fn) {
    var connection = new Pusher.Connection('n', options);

    SteppedObserver(connection._machine, 'state_change', [
      function(e) {
        test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
      },
      function(e) {
        test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
        connection.socket.trigger('open');
      },
      function(e) {
        test.equal(e.newState, 'open', 'state should progress to "open"');
        connection.socket.trigger('message', JSON.stringify({
          event: 'pusher:connection_established',
          data: '{\"socket_id\":\"804.1456320\"}'
        }));
      },
      function(e) {
        test.equal(e.newState, 'connected', 'state should progress to "connected"');
        fn(connection);
      },
    ]);

    connection.connect();
  }

  runner.addSuite('Ping Pong', {
    'Ping Pong': {
      'should respond to pings' : function(test) {
        Pusher.Transport = TestSocket;
        withConnectedConnection(test, {}, function(connection) {
          connection.socket._onsend = function(msg) {
            test.deepEqual(JSON.parse(msg), {'event': 'pusher:pong', 'data': {}}, 'should be a pong');
            test.finish();
          }

          connection.socket.trigger('message', JSON.stringify({
            'event': 'pusher:ping',
            'data': '{}'
          }))
        })
      },
      'should send pings': function(test) {
        Pusher.Transport = TestSocket;

        withConnectedConnection(test, {'activity_timeout': 10}, function(connection) {
          connection.socket._onsend = function(msg) {
            test.deepEqual(JSON.parse(msg), {'event': 'pusher:ping', 'data': {}}, 'should be a ping');
            test.finish();
          }
        })
      }
    }
  })
}.call(this))
