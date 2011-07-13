;(function() {
  var Pusher = this.Pusher;

  var machineTransitions = {
    'initialized': ['waiting', 'failed'],
    'waiting': ['connecting', 'permanentlyClosed', 'waiting'],
    'connecting': ['open', 'permanentlyClosing', 'impermanentlyClosing', 'waiting'],
    'open': ['connected', 'permanentlyClosing', 'impermanentlyClosing', 'waiting'],
    'connected': ['permanentlyClosing', 'impermanentlyClosing', 'waiting'],
    'impermanentlyClosing': ['waiting', 'permanentlyClosing'],
    'permanentlyClosing': ['permanentlyClosed'],
    'permanentlyClosed': ['waiting']
  };


  // Amount to add to time between connection attemtpts per failed attempt.
  var UNSUCCESSFUL_CONNECTION_ATTEMPT_ADDITIONAL_WAIT = 2000;
  var UNSUCCESSFUL_OPEN_ATTEMPT_ADDITIONAL_TIMEOUT = 2000;
  var UNSUCCESSFUL_CONNECTED_ATTEMPT_ADDITIONAL_TIMEOUT = 2000;

  var MAX_CONNECTION_ATTEMPT_WAIT = 5 * UNSUCCESSFUL_CONNECTION_ATTEMPT_ADDITIONAL_WAIT;
  var MAX_OPEN_ATTEMPT_TIMEOUT = 5 * UNSUCCESSFUL_OPEN_ATTEMPT_ADDITIONAL_TIMEOUT;
  var MAX_CONNECTED_ATTEMPT_TIMEOUT = 5 * UNSUCCESSFUL_CONNECTED_ATTEMPT_ADDITIONAL_TIMEOUT;

  function Connection(key, options) {
    var self = this;

    Pusher.EventsDispatcher.call(this);

    this.options = Pusher.Util.extend({encrypted: false}, options || {});

    // define the state machine that runs the connection
    this._machine = new Pusher.Machine(self, 'initialized', machineTransitions, {
      initializedPre: function() {
        self.compulsorySecure = self.options.encrypted;

        self.key = key;
        self.socket = null;
        self.socket_id = null;

        resetConnectionParameters();
      },

      waitingPre: function() {
        self._waitingTimer = setTimeout(function() {
          self._machine.transition('connecting');
        }, self.connectionWait);

        informUser('connecting_in', self.connectionWait);
      },

      waitingExit: function() {
        clearTimeout(self._waitingTimer);
      },

      connectingPre: function() {
        // removed: if not closed, something is wrong that we should fix
        // if(self.socket !== undefined) self.socket.close();
        var url = formatURL(self.key, self.connectionSecure);
        Pusher.debug('Connecting', url);
        self.socket = new Pusher.Transport(url);
        // now that the socket connection attempt has been started,
        // set up the callbacks fired by the socket for different outcomes
        self.socket.onopen = ws_onopen;
        self.socket.onclose = transitionToWaiting;
        self.socket.onerror = ws_onError;

        // allow time to get ws_onOpen, otherwise close socket and try again
        self._connectingTimer = setTimeout(TransitionToImpermanentClosing, self.openTimeout);
      },

      connectingExit: function() {
        clearTimeout(self._connectingTimer);
      },

      connectingToWaiting: function() {
        updateConnectionParameters();

        // FUTURE: update only ssl
      },

      connectingToImpermanentlyClosing: function() {
        updateConnectionParameters();

        // FUTURE: update only timeout
      },

      openPre: function() {
        self.socket.onmessage = ws_onMessage;
        self.socket.onerror = ws_onError;
        self.socket.onclose = function() {
          self._machine.transition('waiting');
        };

        // allow time to get connected-to-Pusher message, otherwise close socket, try again
        self._openTimer = setTimeout(TransitionToImpermanentClosing, self.connectedTimeout);
      },

      openExit: function() {
        clearTimeout(self._openTimer);
      },

      openToWaiting: function() {
        updateConnectionParameters();
      },

      openToImpermanentlyClosing: function() {
        updateConnectionParameters();
      },

      connectedPre: function(socket_id) {
        self.socket_id = socket_id;

        self.socket.onmessage = ws_onMessage;
        self.socket.onerror = ws_onError;
        self.socket.onclose = function() {
          self._machine.transition('waiting');
        };

        resetConnectionParameters();
      },

      connectedPost: function() {
        informUser('connected');
      },

      impermanentlyClosingPost: function() {
        self.socket.onclose = transitionToWaiting;
        self.socket.close();
      },

      permanentlyClosingPre: function() {
        informUser('closing');
      },

      permanentlyClosingPost: function() {
        self.socket.onclose = function() {
          resetConnectionParameters();
          self._machine.transition('permanentlyClosed');
        };

        self.socket.close();
      },

      permanentlyClosedPre: function() {
        informUser('closed');
      },

      failedPre: function() {
        informUser('failed');
        Pusher.debug('WebSockets are not available in this browser.');
      }
    });

    /*-----------------------------------------------
      -----------------------------------------------*/

    function resetConnectionParameters() {
      self.connectionWait = 0;
      self.openTimeout = UNSUCCESSFUL_OPEN_ATTEMPT_ADDITIONAL_TIMEOUT;
      self.connectedTimeout = UNSUCCESSFUL_CONNECTED_ATTEMPT_ADDITIONAL_TIMEOUT;
      self.connectionSecure = self.compulsorySecure;
    }

    function updateConnectionParameters() {
      if (self.connectionWait < MAX_CONNECTION_ATTEMPT_WAIT) {
        self.connectionWait += UNSUCCESSFUL_CONNECTION_ATTEMPT_ADDITIONAL_WAIT;
      }

      if (self.openTimeout < MAX_OPEN_ATTEMPT_TIMEOUT) {
        self.openTimeout += UNSUCCESSFUL_OPEN_ATTEMPT_ADDITIONAL_TIMEOUT;
      }

      if (self.connectedTimeout < MAX_CONNECTED_ATTEMPT_TIMEOUT) {
        self.connectedTimeout += UNSUCCESSFUL_CONNECTED_ATTEMPT_ADDITIONAL_TIMEOUT;
      }

      if (self.compulsorySecure !== true) {
        self.connectionSecure = !self.connectionSecure;
      }
    }

    function formatURL(key, isSecure) {
      var port = Pusher.ws_port;
      var protocol = 'ws://';

      if (isSecure) {
        port = Pusher.wss_port;
        protocol = 'wss://';
      }

      return protocol + Pusher.host + ':' + port + '/app/' + key + '?client=js&version=' + Pusher.VERSION;
    }

    // callback for close and retry.  Used on timeouts.
    function TransitionToImpermanentClosing() {
      self._machine.transition('impermanentlyClosing');
    }

    /*-----------------------------------------------
      WebSocket Callbacks
      -----------------------------------------------*/

    // no-op, as we only care when we get pusher:connection_established
    function ws_onopen() {
      self._machine.transition('open');
    };

    function ws_onMessage(event) {
      var params = parseWebSocketEvent(event);

      // case of invalid JSON payload sent
      // we have to handle the error in the parseWebSocketEvent
      // method as JavaScript error objects are kinda icky.
      if (typeof params === 'undefined') return;

      Pusher.debug('Event recd (event,data)', params.event, params.data);

      // Continue to work with valid payloads:
      if (params.event === 'pusher:connection_established') {
        self._machine.transition('connected', params.data.socket_id);
      } else if (params.event === 'pusher:error') {
        // first inform the end-developer of this error
        informUser('error', {type: 'PusherError', data: params.data});

        // App not found by key - close connection
        if (params.data.code === 4001) {
          self._machine.transition('permanentlyClosing');
        }
      } else if (params.event === 'pusher:heartbeat') {
      } else if (self._machine.is('connected')) {
        informUser('message', params);
      }
    }


    /**
     * Parses an event from the WebSocket to get
     * the JSON payload that we require
     *
     * @param {MessageEvent} event  The event from the WebSocket.onmessage handler.
    **/
    function parseWebSocketEvent(event) {
      try {
        var params = JSON.parse(event.data);

        if (typeof params.data === 'string') {
          try {
            params.data = JSON.parse(params.data);
          } catch (e) {
            if (!(e instanceof SyntaxError)) {
              throw e;
            }
          }
        }

        return params;
      } catch (e) {
        informUser('error', {type: 'MessageParseError', error: e, data: event.data});
      }
    }

    function transitionToWaiting() {
      self._machine.transition('waiting');
    }

    function ws_onError() {
      informUser('error', {
        type: 'WebSocketError'
      });

      // note: required? is the socket auto closed in the case of error?
      self.socket.close();
      self._machine.transition('impermanentlyClosing');
    }

    function informUser(eventName, data) {
      self.trigger(eventName, data);
    }
  };

  Connection.prototype.connect = function() {
    if (!Pusher.Transport) {
      this._machine.transition('failed');
    } else if (!this._machine.is('connected')) {
      this.connectionWait = 0; // note that openTimeout and connectedTimeout are not reset
      this._machine.transition('waiting');
    }
  };

  Connection.prototype.send = function(data) {
    if (this._machine.is('connected')) {
      this.socket.send(data);
      return true;
    } else {
      return false;
    }
  };

  Connection.prototype.disconnect = function() {
    if (this._machine.is('waiting')) {
      this._machine.transition('permanentlyClosed');
    } else {
      this._machine.transition('permanentlyClosing');
    }
  };

  Pusher.Util.extend(Connection.prototype, Pusher.EventsDispatcher.prototype);

  this.Pusher.Connection = Connection;
}).call(this);
