;(function() {
  // Clear version, as we want to use a constant version for tests.
  Pusher.VERSION = '1.10.0';

  // Set this globally, as otherwise we can get some strange
  // errors in tests.
  Pusher.NetInfo = TestNetInfo;

  runner.addSuite('Pusher.Connection', {
    'Initialisation': {
      'new Pusher.Connection("b599fe0f1e4b6f6eb8a6")': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('b599fe0f1e4b6f6eb8a6');

        test.equal(connection.key, 'b599fe0f1e4b6f6eb8a6', 'this.key should be set to the given key');
        test.deepEqual(connection.options, {encrypted: false}, 'this.options should be {encrypted: false} if options are not passed to the constructor');
        test.finish();
      },

      'new Pusher.Connection("b599fe0f1e4b6f6eb8a6", {encrypted: true})': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('b599fe0f1e4b6f6eb8a6', {encrypted: true});

        test.equal(connection.key, 'b599fe0f1e4b6f6eb8a6', 'this.key should be set to the given key');
        test.deepEqual(connection.options, {encrypted: true}, 'this.options should be {encrypted: false} if options are not passed to the constructor');
        test.finish();
      }
    },

    'Public API stability': function(test) {
      Pusher.Transport = TestSocket;
      var connection = new Pusher.Connection('b599fe0f1e4b6f6eb8a6');

      test.equal(typeof connection.connect, 'function', 'the instance should have a "connect" method.');
      test.equal(typeof connection.send, 'function', 'the instance should have a "send" method.');
      test.equal(typeof connection.disconnect, 'function', 'the instance should have a "disconnect" method.');

      test.equal(connection.connect.length, 0, 'the "connect" method should not have any arguments');
      test.equal(connection.send.length, 1, 'the "send" method should have one argument');
      test.equal(connection.disconnect.length, 0, 'the "disconnect" method should not have any arguments');

      // TODO: Test that connection instances inherit from Pusher.EventsDispatcher

      test.finish();
    },

    // TODO: Write tests for state-machine, preferably as standalone tests.
    'State Machine Initialisation': function(test) {
      Pusher.Transport = TestSocket;
      var connection = new Pusher.Connection('b599fe0f1e4b6f6eb8a6');

      test.equal(connection._machine.errors.length, 0, 'should result in no errors');
      test.equal(connection._machine.state, 'initialized', 'should start in the initialized state');
      test.finish();
    },

    'State-flow': {

      'State machine should be valid': function(test) {
        var nativeIndexOf = Array.prototype.indexOf;

        function arrContains(item, obj) {
          if (obj == null) {
            return false;
          }

          // try using native boyer-moore indexOf:
          if (nativeIndexOf && obj.indexOf === nativeIndexOf) {
            return obj.indexOf(item) != -1;
          }

          // fallback to using a for / in loop:
          for (var key in obj) {
            if (obj.hasOwnProperty(key) && obj[key] === item) {
              return true;
            }
          }

          return false;
        }

        // called to validate passed transition data
        var checkMachine = function(machine, initialState) {
          // gather state information
          var allStates = [];
          var toStates = []; // set of states that can be transferred to
          for (var fromState in machine.transitions) {
            // safe guard against prototype.js
            if (machine.transitions.hasOwnProperty(fromState)) {
              var allowableStates = machine.transitions[fromState];

              if (!arrContains(fromState, allStates)) {
                allStates.push(fromState);
              }

              for (var i = 0, l = allowableStates.length; i < l; ++i) {
                if (!arrContains(allowableStates[i], allStates)) {
                  allStates.push(allowableStates[i]);
                }

                if (!arrContains(allowableStates[i], toStates)) {
                  toStates.push(allowableStates[i]);
                }
              }
            }
          }

          for (var i = 0, l = allStates.length; i < l; ++i) {
            // check state is reachable
            // except initial state
            if (allStates[i] !== initialState && !arrContains(allStates[i], toStates)) {
              test.ok(false, 'This state is not reachable: ' + allStates[i]);
            }
          }

          test.finish();
        };

        // Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('a');

        checkMachine(connection._machine, 'initialized');
      },

      //
      //  successful connection with correct details
      //
      'successful connection with correct details': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('a');

        var watcher = new EventsWatcher(connection, [
          'connecting_in',
          'connecting',
          'connected'
        ]);


        SteppedObserver(connection._machine, 'state_change', [
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          // connecting
          function(e) {
            test.equal(watcher.next().name, 'connecting', 'the "connecting" event should be emitted');

            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
            test.equal(connection.socket.readyState, connection.socket.CONNECTING, 'the socket readyState should change to connecting');

            connection.socket.trigger('open');
          },
          // open
          function(e) {
            test.equal(e.newState, 'open', 'state should progress to "open"');

            connection.socket.trigger('message', JSON.stringify({
              event: 'pusher:connection_established',
              data: '{\"socket_id\":\"804.1456320\"}'
            }));
          },
          // connected
          function(e) {
            test.equal(e.newState, 'connected', 'state should progress to "connected"');
            test.equal(connection.socket.readyState, connection.socket.OPEN, 'the socket readyState should change to open');

            test.equal(connection.socket.URL, 'ws://ws.pusherapp.com:80/app/a?client=js&version=' + Pusher.VERSION);
            test.equal(connection.socket_id, '804.1456320', 'the socket_id should be set on connected.');

            // This needs to be in a timer to break the callstack,
            // otherwise we jump directly to permanentlyClosing
            //
            // (state_change emission chaining)
            defer(connection.disconnect, connection);
          },
          function(e) {
            test.equal(watcher.next().name, 'connected', 'the "connected" event should be emitted');
            test.finish();
          }
        ]);

        connection.connect();
      },


      //  successful and disconnect then reconnection
      //
      'successful and disconnect then reconnection': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('b');

        var watcher = new EventsWatcher(connection, [
          'connecting_in',
          'connecting',
          'connected',
          'disconnected'
        ]);

        SteppedObserver(connection._machine, 'state_change', [
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          // connecting
          function(e) {
            test.equal(watcher.next().name, 'connecting', 'the "connecting" event should be emitted');

            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
            test.equal(connection.socket.readyState, connection.socket.CONNECTING, 'the socket readyState should change to connecting');

            connection.socket.trigger('open');
          },
          // open
          function(e) {
            test.equal(e.newState, 'open', 'state should progress to "open"');

            connection.socket.trigger('message', JSON.stringify({
              event: 'pusher:connection_established',
              data: '{\"socket_id\":\"804.1456320\"}'
            }));
          },
          // connected
          function(e) {
            test.equal(e.newState, 'connected', 'state should progress to "connected"');

            defer(connection.disconnect, connection);
          },
          // permanentlyClosing
          function(e) {
            test.equal(watcher.next().name, 'connected', 'the "connected" event should be emitted');

            test.equal(e.newState, 'permanentlyClosing', 'state should progress to "permanentlyClosing"');
            // Safari does not implement this state change
            // test.equal(connection.socket.readyState, connection.socket.CLOSING, 'the socket readyState should change to closing');
          },
          // permanentlyClosed
          function(e) {
            test.equal(e.newState, 'permanentlyClosed', 'state should progress to "permanentlyClosed"');
            test.equal(connection.socket.readyState, connection.socket.CLOSED, 'the socket readyState should change to closed');

            connection.connect();
          },
          function(e) {
            test.equal(watcher.next().name, 'disconnected', 'the "disconnected" event should be emitted');

            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');

            test.equal(connection.connectionSecure, false, 'connection should switch to using wss');
            test.equal(connection.connectionWait, 0, 'connectionWait should stay the same');
          },
          // connecting
          function(e) {
            test.equal(watcher.next().name, 'connecting', 'the "connecting" event should be emitted');
            test.equal(e.newState, 'connecting', 'state should intially be "connecting"');

            defer(connection.disconnect, connection);
          },
          // permanentlyClosing
          function(e) {},
          // permanentlyClosed
          function(e) {
            test.finish();
          }
        ]);

        connection.connect();
      },

  //-----------------------------------------------
  //-----------------------------------------------

      'waiting -> connecting -> (onclose) -> waiting': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('c');
        var watcher = new EventsWatcher(connection, [
          'connecting',
          'connecting_in'
        ]);

        SteppedObserver(connection._machine, 'state_change', [
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          // connecting
          function(e) {
            test.equal(watcher.next().name, 'connecting', 'the "connecting" event should be emitted');
            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
            test.equal(connection.socket.readyState, connection.socket.CONNECTING, 'the socket readyState should change to connecting');

            connection.socket.trigger('close');
          },
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should progress to "waiting"');

            test.equal(connection.connectionSecure, true, 'connection should switch to using wss');
            test.equal(connection.connectionWait, 2000, 'connectionWait should increase by 2000');

            defer(connection.disconnect, connection);
          },
          // this should be permanentlyClosing
          function(e) {
            test.deepEqual(watcher.next(), {name: 'connecting_in', data: 2000}, 'the "connecting_in" event should be emitted with event_data of [Number:2000]');
            test.finish();
          }
        ]);

        connection.connect();
      },


      //  Test:
      //    waiting -> connecting -> (onopen)
      //    -> opened -> (onclose) -> waiting
      //
      'waiting -> connecting -> (onopen) -> opened -> (onclose) -> waiting': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('d');

        var watcher = new EventsWatcher(connection, [
          'connecting',
          'connecting_in'
        ]);

        SteppedObserver(connection._machine, 'state_change', [
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          // connecting
          function(e) {
            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
            test.equal(watcher.next().name, 'connecting', 'the "connecting" event should be emitted');
            test.equal(connection.socket.readyState, connection.socket.CONNECTING, 'the socket readyState should change to connecting');

            connection.socket.trigger('open');
          },
          // open
          function(e) {
            test.equal(e.newState, 'open', 'state should progress to "open"');
            connection.socket.trigger('close');
          },
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should progress to "waiting"');

            test.equal(connection.connectionSecure, true, 'connection should switch to using wss');
            test.equal(connection.connectionWait, 2000, 'connectionWait should increase by 2000');

            connection.disconnect();
            test.finish();
          }
        ]);

        connection.connect();
      },

      //
      // start reconnect after connected connection dropped
      //
      'waiting -> connection -> opened -> connected -> (onclose) -> waiting': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('e');

        var watcher = new EventsWatcher(connection, [
          'connecting',
          'connecting_in',
          'connected'
        ]);

        SteppedObserver(connection._machine, 'state_change', [
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          // connecting
          function(e) {
            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
            test.equal(watcher.next().name, 'connecting', 'the "connecting" event should be emitted');
            connection.socket.trigger('open');
          },
          // open
          function(e) {
            test.equal(e.newState, 'open', 'state should progress to "open"');

            connection.socket.trigger('message', JSON.stringify({
              event: 'pusher:connection_established',
              data: '{\"socket_id\":\"804.1456320\"}'
            }));
          },
          // connected
          function(e) {
            test.equal(e.newState, 'connected', 'state should progress to "connected"');
            connection.socket.trigger('close');
          },
          function(e) {
            // have to test connected event in next state because, in prev one, connectedPost has not been run
            test.equal(watcher.next().name, 'connected', 'the "connected" event should be emitted');
            test.equal(e.newState, 'waiting', 'state should progress to "waiting"');

            connection.disconnect();
          },
          // permanentlyClosed
          function() {
            test.finish();
          }
        ]);

        connection.connect();
      },

      'waiting -> connection -> opened -> (app not found) -> permanentlyClosing -> permanentlyClosed': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('f');
        var watcher = new EventsWatcher(connection, [
          'connecting',
          'connecting_in',
          'error'
        ]);

        SteppedObserver(connection._machine, 'state_change', [
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          // connecting
          function(e) {
            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
            test.equal(watcher.next().name, 'connecting', 'the "connecting" event should be emitted');
            connection.socket.trigger('open');
          },
          // open
          function(e) {
            test.equal(e.newState, 'open', 'state should progress to "open"');

            connection.socket.trigger('message', JSON.stringify({
              event: 'pusher:error',
              data: {
                message: 'Could not find app by key f',
                code: 4001
              }
            }));
          },
          // permanentlyClosing
          function(e) {
            test.deepEqual(
              watcher.next(),
              {
                name: 'error',
                data: {
                  type: 'PusherError',
                  data: { code: 4001, message: 'Could not find app by key f' }
                }
              },
              'the "error" event should be emitted with given event_data'
            );

            test.equal(e.newState, 'permanentlyClosing', 'state should progress to "permanentlyClosing"');
          },
          // permanentlyClosed
          function(e) {
            test.equal(e.newState, 'permanentlyClosed', 'state should intially be "permanentlyClosed"');
            test.finish();
          }
        ]);

        connection.connect();
      },

      //-----------------------------------------------
      //-----------------------------------------------

      'timeout occurs when in connecting and awaiting open': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('g');
        var watcher = new EventsWatcher(connection, [
          'connecting',
          'connecting_in'
        ]);

        SteppedObserver(connection._machine, 'state_change', [
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should initially be "waiting"');
          },
          // connecting
          function(e) {
            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
            test.equal(watcher.next().name, 'connecting', 'the "connecting" event should be emitted');
            // open is not fired
          },
          // impermanentlyClosing
          function(e) {
            test.equal(e.newState, 'impermanentlyClosing', 'state should progress to "impermantentlyClosing"');
          },
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should progress to "waiting"');
            connection.disconnect();
          },
          function(e) {
            test.finish();
          }
        ]);

        connection.connect();
      },

      'timeout occurs when awaiting pusher connected event': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('h');
        var watcher = new EventsWatcher(connection, [
          'connecting',
          'connecting_in'
        ]);

        SteppedObserver(connection._machine, 'state_change', [
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          // connecting
          function(e) {
            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
            test.equal(watcher.next().name, 'connecting', 'the "connecting" event should be emitted');
            connection.socket.trigger('open');
          },
          function(e) {
            test.equal(e.newState, 'open', 'state should progress to "open"');
          },
          function(e) {
            test.equal(e.newState, 'impermanentlyClosing', 'state should progress to "impermanentlyClosing"');
          },
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should progress to "waiting"');
            connection.disconnect();
            test.finish();
          }
        ]);

        connection.connect();
      },

      //-----------------------------------------------
      //-----------------------------------------------

      'error occurs when in connecting and awaiting open': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('i');
        var watcher = new EventsWatcher(connection, [
          'connecting',
          'connecting_in',
          'error'
        ]);

        SteppedObserver(connection._machine, 'state_change', [
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          // connecting
          function(e) {
            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
            test.equal(watcher.next().name, 'connecting', 'the "connecting" event should be emitted');
            connection.socket.trigger('error');
          },
          // impermanentlyClosing
          function(e) {
            // TODO: do deepEqual on the error object as err.type should equal "WebSocketError"
            test.equal(watcher.next().name, 'error', 'the "error" event should be emitted');
            test.equal(e.newState, 'impermanentlyClosing', 'state should progress to "impermantentlyClosing"');
          },
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should progress to "waiting"');
            connection.disconnect();
            test.finish();
          }
        ]);

        connection.connect();
      },

      'error occurs when awaiting pusher connected event': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('j');
        var watcher = new EventsWatcher(connection, [
          'connecting',
          'connecting_in',
          'error'
        ]);

        SteppedObserver(connection._machine, 'state_change', [
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          // connecting
          function(e) {
            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
            test.equal(watcher.next().name, 'connecting', 'the "connecting" event should be emitted');
            connection.socket.trigger('open');
          },
          function(e) {
            test.equal(e.newState, 'open', 'state should progress to "open"');
            connection.socket.trigger('error');
          },
          function(e) {
            test.equal(watcher.next().name, 'error', 'the "error" event should be emitted');
            test.equal(e.newState, 'impermanentlyClosing', 'state should progress to "impermantentlyClosing"');
          },
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should progress to "waiting"');
            connection.disconnect();
            test.finish();
          }
        ]);

        connection.connect();
      },

      //-----------------------------------------------
      //-----------------------------------------------

      'user closes during waiting': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('k');

        // TODO: test that disconnected event was not emitted.

        SteppedObserver(connection._machine, 'state_change', [
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
            connection.disconnect();
          },
          function(e) {
            test.equal(e.newState, 'permanentlyClosed', 'state should progress to "permanentlyClosed"');
            test.finish();
          }
        ]);

        connection.connect();
      },

      'user closes during connecting': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('l');
        var watcher = new EventsWatcher(connection, [
          'connecting',
          'connecting_in'
        ]);

        SteppedObserver(connection._machine, 'state_change', [
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          function(e) {
            test.equal(e.newState, 'connecting', 'state should intially be "connecting"');
            test.equal(watcher.next().name, 'connecting', 'the "connecting" event should be emitted');
            connection.disconnect();
          },
          function(e) {
            test.equal(e.newState, 'permanentlyClosing', 'state should progress to "permanentlyClosing"');
          },
          function(e) {
            test.equal(e.newState, 'permanentlyClosed', 'state should progress to "permanentlyClosed"');
            test.finish();
          }
        ]);
        connection.connect();
      },

      'user closes during opened': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('m');
        var watcher = new EventsWatcher(connection, [
          'connecting',
          'connecting_in'
        ]);

        SteppedObserver(connection._machine, 'state_change', [
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          function(e) {
            test.equal(e.newState, 'connecting', 'state should intially be "connecting"');
            test.equal(watcher.next().name, 'connecting', 'the "connecting" event should be emitted');
            connection.socket.trigger('open');
          },
          function(e) {
            test.equal(e.newState, 'open', 'state should progress to "open"');
            connection.disconnect();
          },
          function(e) {
            test.equal(e.newState, 'permanentlyClosing', 'state should progress to "permanentlyClosing"');
          },
          function(e) {
            test.equal(e.newState, 'permanentlyClosed', 'state should progress to "permanentlyClosed"');
            test.finish();
          }
        ]);

        connection.connect();
      },

      //-----------------------------------------------
      //-----------------------------------------------

      //  Test:
      //    waiting -> connecting -> (onclose) -> waiting
      //    -> connecting -> open -> connected -> (onclose)
      //
      // For this test we must first fail a connection by (onclose) so that
      // we increment the connectionWait time and toggle ssl
      'Successful connection resets conn wait to 0 and ssl to its default initial value': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('n');

        var watcher = new EventsWatcher(connection, [
          'connecting',
          'connecting_in',
          'connected'
          // trigger disconnected?
        ]);

        SteppedObserver(connection._machine, 'state_change', [
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          // connecting
          function(e) {
            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
            test.equal(watcher.next().name, 'connecting', 'the "connecting" event should be emitted');
            test.equal(connection.socket.readyState, connection.socket.CONNECTING, 'the socket readyState should change to connecting');

            connection.socket.trigger('close');
          },
          // waiting
          function(e) {
            test.equal(e.newState, 'waiting', 'state should progress to "waiting"');

            test.equal(connection.connectionSecure, true, 'connection should switch to using wss');
            test.equal(connection.connectionWait, 2000, 'connectionWait should increase by 2000');
          },
          // connecting
          function(e) {
            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
            test.deepEqual(watcher.next(), {name: 'connecting_in', data: 2000}, '"connecting_in" should be emitted w/ [Number:2000]');
            test.equal(connection.socket.readyState, connection.socket.CONNECTING, 'socket readyState should change to connecting');

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
            connection.socket.trigger('close');
          },
          function(e) {
            // have to test connected event in next state because, in prev one, connectedPost has not been run
            test.equal(watcher.next().name, 'connected', 'the "connected" event should be emitted');
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
            test.equal(connection.connectionSecure, false, 'connection should switch to using ws');
            test.equal(connection.connectionWait, 0, 'connectionWait should reset to 0');
            connection.disconnect();
            test.finish();
          }
        ]);

        connection.connect();
      },

      //-----------------------------------------------
      //-----------------------------------------------

      'check that forced ssl actually uses ssl first time, on second try and after successful connect': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('o', {encrypted: true});

        test.deepEqual(connection.options, {encrypted: true}, 'this.options should be {encrypted: true}');

        SteppedObserver(connection._machine, 'state_change', [
          function(e) {
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          function(e) {
            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
            test.equal(connection.socket.URL.substr(0, 3), 'wss'); // should use ssl
            connection.socket.trigger('open');
          },
          function(e) {
            test.equal(e.newState, 'open', 'state should progress to "open"');
            connection.socket.trigger('close');
          },
          function(e) {
            test.equal(e.newState, 'waiting', 'state should progress to "waiting"');
          },
          function(e) {
            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');
            test.equal(connection.socket.URL.substr(0, 3), 'wss'); // should still use ssl

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
            connection.socket.trigger('close');
          },
          function(e) {
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
          },
          // connecting
          function(e) {
            test.equal(e.newState, 'connecting', 'state should progress to "connecting"');

            test.equal(connection.socket.URL.substr(0, 3), 'wss'); // should still be using ssl

            connection.disconnect();
            test.finish();
          }
        ]);

        connection.connect();
      },

//-----------------------------------------------
//-----------------------------------------------

      'Should result in a state of "failed" if Pusher.Transport === null': function(test) {
        Pusher.Transport = null;

        var connection = new Pusher.Connection('n1');
        var watcher = new EventsWatcher(connection, ['failed']);

        SteppedObserver(connection._machine, 'state_change', [
          function(e) {
            test.equal(e.newState, 'failed', 'state should intially be "failed"');
            connection.disconnect();
          },
          function(e) {
            test.equal(watcher.next().name, 'failed', 'the "failed" event should be emitted');
            test.finish();
          }
        ]);

        connection.connect();
      },

      'Should result in a state of "failed" if Pusher.Transport === undefined': function(test) {
        Pusher.Transport = undefined;

        var connection = new Pusher.Connection('n2');
        var watcher = new EventsWatcher(connection, ['failed']);

        SteppedObserver(connection._machine, 'state_change', [
          function(e) {
            test.equal(e.newState, 'failed', 'state should intially be "failed"');
            connection.disconnect();
          },
          function(e) {
            test.equal(watcher.next().name, 'failed', 'the "failed" event should be emitted');
            test.finish();
          }
        ]);

        connection.connect();
      },

      'Should be able to disconnect after "failed" state.': function(test) {
        Pusher.Transport = undefined;

        var connection = new Pusher.Connection('n3');

        SteppedObserver(connection._machine, 'state_change', [
          function(e) {
            test.equal(e.newState, 'failed', 'state should intially be "failed"');
            connection.disconnect();
          },
          function(e) {
            test.equal(e.newState, 'permanentlyClosing', 'the state should transition to "permanentlyClosing".');
            test.finish();
          }
        ]);

        connection.connect();
      },


//-----------------------------------------------
//-----------------------------------------------

      'User should be able to bypass connection wait with explicit socket.connection.connect() call': function(test) {
        Pusher.Transport = TestSocket;
        var connection = new Pusher.Connection('r');
        var nextConnectionAttempt = null;

        SteppedObserver(connection._machine, 'state_change', [
          function(e) {
            test.equal(e.newState, 'waiting', 'state should be "waiting"');
          },
          function(e) {
            test.equal(e.newState, 'connecting', 'state should be "connecting"');
            connection.socket.trigger('close');
          },
          function(e) {
            test.equal(e.newState, 'waiting', 'state should be "waiting"');
            test.equal(connection.connectionWait, 2000, 'connectionWait should increase by 2000');
            test.equal(connection.netInfo.isOnLine(), true, 'connection.netInfo should return true for isOnLine');
            nextConnectionAttempt = new Date().getTime() + connection.connectionWait;
            connection.connect();
          },
          function(e) { // straight to connecting
            test.equal(e.newState, 'connecting', 'state should be "connecting"');
            connection.socket.trigger('open');
          },
          function(e) {
            test.equal(e.newState, 'open', 'state should intially be "open"');
            connection.socket.trigger('message', JSON.stringify({
              event: 'pusher:connection_established',
              data: '{\"socket_id\":\"804.1456320\"}'
            }));
          },
          function(e) {
            test.equal(e.newState, 'connected', 'state should intially be "connected"');
            test.ok(new Date().getTime() + 500 < nextConnectionAttempt, "check we reconnected at least 500ms faster than if we'd just waited")
            test.finish();
          }
        ]);

        // Connect the socket to continue the tests.
        connection.connect();
      }
    },


//-----------------------------------------------
//-----------------------------------------------


    'NetInfo': {
      'User: unavailable, machine: waiting if connected and then internet dies': function(test) {
        Pusher.Transport = TestSocket;
        Pusher.NetInfo = TestNetInfo;
        var connection = new Pusher.Connection('n');

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
            connection.netInfo.unplug();
          },
          function(e) {
            test.equal(e.newState, 'waiting', 'state should progress to "waiting"');
            test.equal(connection.state, 'unavailable', 'user state should be "unavailable"');
            defer(connection.disconnect, connection);
          },
          function(e) {
            test.finish();
          }
        ]);

        connection.connect();
      },

      'User state should go from waiting to unavailable if internet down': function(test) {
        Pusher.Transport = TestSocket;
        Pusher.NetInfo = TestNetInfo;
        var connection = new Pusher.Connection('n');

        connection.netInfo.unplug();
        test.equal(connection.netInfo.isOnLine(), false, 'mock onLine should be false');

        SteppedObserver(connection._machine, 'state_change', [
          function(e) {
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
            test.equal(connection.state, 'unavailable', 'user state should be "unavailable"');
            // This needs to be in the same block as you don't actually get any state_change
            // event after unavailable.
            defer(connection.disconnect, connection);
          },
          function(e) {
            test.finish();
          },
        ]);

        connection.connect();
      },

      'Should start connecting if net connection comes back': function(test) {
        Pusher.Transport = TestSocket;
        Pusher.NetInfo = TestNetInfo;
        var connection = new Pusher.Connection('n');

        connection.netInfo.unplug();
        test.equal(connection.netInfo.isOnLine(), false, 'mock onLine should be false');

        SteppedObserver(connection._machine, 'state_change', [
          function(e) {
            test.equal(e.newState, 'waiting', 'state should intially be "waiting"');
            test.equal(connection.state, 'unavailable', 'user state should be "unavailable"');
            connection.netInfo.plugIn();
          },
          function(e) {
            test.equal(e.newState, 'connecting', 'state should be "connecting"');
            defer(connection.disconnect, connection);
          },
          function(e) {
            test.finish();
          },
        ]);

        connection.connect();
      }
    },

    'Message Sending and Receiving': {
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
            test.equal(connection.socket._sendQueue.length, 1, 'connection.socket should have one message queued for sending');

            test.finish();
          }
        ]);

        // Try and send a message while not connected.
        test.equal(connection.send(payload), false, 'connection.send should return false if not connected');

        // Connect the socket to continue the tests.
        connection.connect();
      }
    },

    'Test connection back-off limit': function(test) {
      Pusher.Transport = TestSocket;
      var connection = new Pusher.Connection('z');

      var watcher = new EventsWatcher(connection, [
        'connecting_in',
        'connecting',
        'unavailable',
        'connected'
      ]);

      SteppedObserver(connection._machine, 'state_change', [
        // waiting
        function(e) {
          test.equal(e.newState, 'waiting', 'state should progress to "waiting"');
          test.equal(connection.connectionWait, 0, 'connectionWait should be 0');
        },
        // connecting
        function(e) {
          test.equal(watcher.next().name, 'connecting', 'the "connecting" event should be emitted');
          connection.socket.trigger('open');
        },
        // open
        function(e) {
          connection.socket.trigger('close');
        },
        // waiting
        function(e) {
          test.equal(e.newState, 'waiting', 'state should progress to "waiting"');
          test.equal(connection.connectionWait, 2000, 'connectionWait should increase by 2000');
        },
        function(e) {
          test.deepEqual(watcher.next(), {name: 'connecting_in', data: 2000}, '"connecting_in" event should be emitted with [Number:2000]');
          connection.socket.trigger('open');
        },
        // open
        function(e) {
          connection.socket.trigger('close');
        },
        // waiting
        function(e) {
          test.equal(e.newState, 'waiting', 'state should progress to "waiting"');
          test.equal(connection.connectionWait, 4000, 'connectionWait should increase by 2000');
        },
        function(e) {
          test.deepEqual(watcher.next(), {name: 'connecting_in', data: 4000}, '"connecting_in" event should be emitted with [Number:4000]');
          connection.socket.trigger('open');
        },
        // open
        function(e) {
          connection.socket.trigger('close');
        },
        // waiting
        function(e) {
          test.equal(e.newState, 'waiting', 'state should progress to "waiting"');
          test.equal(connection.connectionWait, 6000, 'connectionWait should increase by 2000');
        },
        function(e) {
          test.deepEqual(watcher.next(), {name: 'connecting_in', data: 6000}, '"connecting_in" event should be emitted with [Number:6000]');
          connection.socket.trigger('open');
        },
        // open
        function(e) {
          connection.socket.trigger('close');
        },
        // waiting
        function(e) {
          test.equal(e.newState, 'waiting', 'state should progress to "waiting"');
          test.equal(connection.connectionWait, 8000, 'connectionWait should increase by 2000');
        },
        function(e) {
          test.deepEqual(watcher.next(), {name: 'connecting_in', data: 8000}, '"connecting_in" event should be emitted with [Number:8000]');
          connection.socket.trigger('open');
        },
        // open
        function(e) {
          connection.socket.trigger('close');
        },
        // waiting
        function(e) {
          test.equal(e.newState, 'waiting', 'state should progress to "waiting"');
          test.equal(connection.connectionWait, 10000, 'connectionWait should increase by 2000');
        },
        function(e) {
          test.deepEqual(watcher.next(), {name: 'connecting_in', data: 10000}, '"connecting_in" event should be emitted with [Number:10000]');
          test.equal(watcher.next().name, 'unavailable', 'the "unavailable" event should be emitted');
          connection.socket.trigger('open');
        },
        // open
        function(e) {
          connection.socket.trigger('close');
        },
        // waiting
        function(e) {
          test.equal(e.newState, 'waiting', 'state should progress to "waiting"');
          test.equal(connection.connectionWait, 10000, 'connectionWait should remain constant at 10000');
        },
        function(e) {
          test.deepEqual(watcher.next(), {name: 'connecting_in', data: 10000}, '"connecting_in" event should be emitted with [Number:10000]');

          // The next event on the watcher should be undefined
          // as we should not have emitted another event.
          test.equal(watcher.next(), undefined, 'the "unavailable" event should not be emitted');
          // now lets actually connect.
          connection.socket.trigger('open');
        },
        // open
        function(e) {
          test.equal(e.newState, 'open', 'state should progress to "open"');

          connection.socket.trigger('message', JSON.stringify({
            event: 'pusher:connection_established',
            data: '{\"socket_id\":\"804.1456320\"}'
          }));
        },
        // connected
        function(e) {
          test.equal(e.newState, 'connected', 'state should progress to "connected"');
          defer(connection.disconnect, connection);
        },
        function(e) {
          test.equal(watcher.next().name, 'connected', 'the "connected" event should be emitted');
          test.finish();
        }
      ]);

      connection.connect();
    }
  });
})();
