;(function() {

  Tests.addSuite('Pusher.ConnectionRegressions', {
    'Bug: impermanentlyClosing to connected should not occur if': {
      'open state, get error, get conn_est': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('a');

        SteppedObserver(connection._machine, 'state_change', [
          function(e) { // waiting
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          function(e) { // connecting
            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
            connection.socket.trigger('open');
          },
          function(e) { // open
            test.equal(e.newState, 'open', 'state should progress to "open"');

            // error will trigger transition to impermanentlyClosing
            connection.socket.trigger('message', JSON.stringify({
              event: 'pusher:error', data: { code: 4201, message: 'blah' }
            }));
          },
          function(e) { // impermanentlyClosing
            test.equal(e.newState, 'impermanentlyClosing', 'state should progress to "impermanentlyClosing"');

            // fail if invalid transition happens
            connection._machine.bind('invalid_transition_attempt', function(data) {
              test.ok(false, "Should not transition from " + data.oldState + " to " + data.newState);
            });

            connection.socket.trigger('message', JSON.stringify({
              event: 'pusher:connection_established', data: '{\"socket_id\":\"804.1456320\"}'
            }));
          },
          function(e) { // waiting
            test.equal(e.newState, 'waiting', 'state should progress to "waiting"');
            test.finish();
          }
        ]);

        connection.connect();
      },

      'open state, timeout on connected, close sock, get conn_est during close handshake': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('a');

        SteppedObserver(connection._machine, 'state_change', [
          function(e) { // waiting
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          function(e) { // connecting
            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
            connection.socket.trigger('open');
          },
          function(e) { // open
            test.equal(e.newState, 'open', 'state should progress to "open"');
            // allow timeout by not sending connection_established
          },
          function(e) { // impermanentlyClosing
            test.equal(e.newState, 'impermanentlyClosing', 'state should progress to "impermanentlyClosing"');

            // fail if invalid transition happens
            connection._machine.bind('invalid_transition_attempt', function(data) {
              test.ok(false, "Should not transition from " + data.oldState + " to " + data.newState);
            });

            connection.socket.trigger('message', JSON.stringify({
              event: 'pusher:connection_established', data: '{\"socket_id\":\"804.1456320\"}'
            }));
          },
          function(e) { // waiting
            test.equal(e.newState, 'waiting', 'state should progress to "waiting"');
            test.finish();
          }
        ]);

        connection.connect();
      }
    },


    'Bug: impermanentlyClosing -> impermanentlyClosing': function(test) {
      // See the issue for the hypothesis on how this happens: https://github.com/pusher/pusher-server/issues/266
      // this test only really mimics the issue in Firefox, because Chrome and Safari do not fire the onerror callback
      // for this type of error
      Pusher.Transport = TestSocket;
      var connection = new Pusher.Connection('a');

      SteppedObserver(connection._machine, 'state_change', [
        function(e) { }, // waiting
        function(e) { // connecting
          test.equal(e.newState, 'connecting');

          // trigger the calling of the onerror callback twice in succession
          connection.socket.trigger('error');
          connection.socket.trigger('error');

          // then close the conn to simulate a fault like an unexpected response
          connection.socket.trigger('close');
        },
        function(e) { // waiting
          // return to waiting - no impermanentlyClosing, and certainly no impermanentlyClosing -> impermanentlyClosing
          test.equal(e.newState, 'waiting');
          test.finish();
        }
      ]);

      connection.connect();
    },

    'Bug: impermanentlyClosing to open should not occur if': {
      'connecting state, get error, get open event': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('a');

        SteppedObserver(connection._machine, 'state_change', [
          function(e) { // waiting
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          function(e) { // connecting
            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');

            // error will trigger transition to impermanentlyClosing
            connection.socket.trigger('message', JSON.stringify({
              event: 'pusher:error', data: { code: 4201, message: 'blah' }
            }));
          },
          function(e) { // impermanentlyClosing
            test.equal(e.newState, 'impermanentlyClosing', 'state should progress to "impermanentlyClosing"');

            // fail if invalid transition happens
            connection._machine.bind('invalid_transition_attempt', function(data) {
              test.ok(false, "Should not transition from " + data.oldState + " to " + data.newState);
            });

            connection.socket.trigger('open');
          },
          function(e) { // waiting
            test.equal(e.newState, 'waiting', 'state should progress to "waiting"');
            test.finish();
          }
        ]);

        connection.connect();
      },

      'connecting state, timeout on open, close sock, get open event during close handshake': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('a');

        SteppedObserver(connection._machine, 'state_change', [
          function(e) { // waiting
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          function(e) { // connecting
            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
            // allow timeout by not sending open event
          },
          function(e) { // impermanentlyClosing
            test.equal(e.newState, 'impermanentlyClosing', 'state should progress to "impermanentlyClosing"');

            // fail if invalid transition happens
            connection._machine.bind('invalid_transition_attempt', function(data) {
              test.ok(false, "Should not transition from " + data.oldState + " to " + data.newState);
            });

            connection.socket.trigger('open');
          },
          function(e) { // waiting
            test.equal(e.newState, 'waiting', 'state should progress to "waiting"');
            test.finish();
          }
        ]);

        connection.connect();
      }
    },

    'Bug: failed -> failed should not occur if': {
      'no transport, already failed, then explicitly call connect()': function(test) {
        Pusher.Transport = null;

        var connection = new Pusher.Connection('a');
        SteppedObserver(connection._machine, 'state_change', [
          function(e) {
            test.equal(e.newState, 'failed');
            connection.connect() // now bug fixed, will not try to transition to failed (again)
            Pusher.Transport = TestSocket; // restore for other conns for which testing is finished but which are still operating
            test.finish();
          }
        ]);

        connection.connect(); // initial, automatic conn attempt
      }
    },

    'Bug: permanentlyClosed -> failed should be allowed if': {
      'no transport, already failed, call disconnect() and then connect()': function(test) {
        Pusher.Transport = null;
        var connection = new Pusher.Connection('q');
        SteppedObserver(connection._machine, 'state_change', [
          function(e) {
            test.equal(e.newState, 'failed');
            connection.disconnect() // explicit conn attempt
          },
          function(e) {
            test.equal(e.newState, 'permanentlyClosed');
            connection.connect();
          },
          function(e) {
            test.equal(e.newState, 'failed');
            Pusher.Transport = TestSocket; // restore
            test.finish();
          },
        ]);

        connection.connect(); // initial, automatic conn attempt
      }
    }
  });
})();

