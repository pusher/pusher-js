;(function() {
  var Pusher = this.Pusher;

  /*
    A little bauble to interface with window.navigator.onLine,
    window.ononline and window.onoffline.  Easier to mock.
  */
  var NetInfo = function() {
    var self = this;
    Pusher.EventsDispatcher.call(this);
    // This is okay, as IE doesn't support this stuff anyway.
    if (window.addEventListener !== undefined) {
      window.addEventListener("online", function() {
        self.emit('online', null);
      }, false);
      window.addEventListener("offline", function() {
        self.emit('offline', null);
      }, false);
    }
  };

  // Offline means definitely offline (no connection to router).
  // Inverse does NOT mean definitely online (only currently supported in Safari
  // and even there only means the device has a connection to the router).
  NetInfo.prototype.isOnLine = function() {
    if (window.navigator.onLine === undefined) {
      return true;
    } else {
      return window.navigator.onLine;
    }
  };

  Pusher.Util.extend(NetInfo.prototype, Pusher.EventsDispatcher.prototype);
  this.Pusher.NetInfo = Pusher.NetInfo = NetInfo;

  var machineTransitions = {
    'initialized': ['waiting', 'failed'],
    'waiting': ['connecting', 'permanentlyClosed'],
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

  function resetConnectionParameters(connection) {
    connection.connectionWait = 0;

    if (Pusher.TransportType === 'flash') {
      // Flash needs a bit more time
      connection.openTimeout = 5000;
    } else {
      connection.openTimeout = 2000;
    }
    connection.connectedTimeout = 2000;
    connection.connectionSecure = connection.compulsorySecure;
    connection.connectionAttempts = 0;
  }

  function Connection(key, options) {
    var self = this;

    Pusher.EventsDispatcher.call(this);

    this.options = Pusher.Util.extend({encrypted: false}, options || {});

    this.netInfo = new Pusher.NetInfo();

    this.netInfo.bind('online', function(){
      if (self._machine.is('waiting')) {
        self._machine.transition('connecting');
        triggerStateChange('connecting');
      }
    });

    this.netInfo.bind('offline', function() {
      if (self._machine.is('connected')) {
        // These are for Chrome 15, which ends up
        // having two sockets hanging around.
        self.socket.onclose = undefined;
        self.socket.onmessage = undefined;
        self.socket.onerror = undefined;
        self.socket.onopen = undefined;

        self.socket.close();
        self.socket = undefined;
        self._machine.transition('waiting');
      }
    })

    // define the state machine that runs the connection
    this._machine = new Pusher.Machine(self, 'initialized', machineTransitions, {

      // TODO: Use the constructor for this.
      initializedPre: function() {
        self.compulsorySecure = self.options.encrypted;

        self.key = key;
        self.socket = null;
        self.socket_id = null;

        self.state = 'initialized';
      },

      waitingPre: function() {
        if (self.connectionWait > 0) {
          informUser('connecting_in', self.connectionWait);
        }

        if (self.netInfo.isOnLine() === false || self.connectionAttempts > 4){
          triggerStateChange('unavailable');
        } else {
          triggerStateChange('connecting');
        }

        if (self.netInfo.isOnLine() === true) {
          self._waitingTimer = setTimeout(function() {
            self._machine.transition('connecting');
          }, self.connectionWait);
        }
      },

      waitingExit: function() {
        clearTimeout(self._waitingTimer);
      },

      connectingPre: function() {
        // Case that a user manages to get to the connecting
        // state even when offline.
        if (self.netInfo.isOnLine() === false) {
          self._machine.transition('waiting');
          triggerStateChange('unavailable');

          return;
        }

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
        self.socket.onclose = transitionToWaiting;

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
        self.socket.onclose = transitionToWaiting;

        resetConnectionParameters(self);
      },

      connectedPost: function() {
        triggerStateChange('connected');
      },

      connectedExit: function() {
        triggerStateChange('disconnected');
      },

      impermanentlyClosingPost: function() {
        self.socket.onclose = transitionToWaiting;
        self.socket.close();
      },

      permanentlyClosingPost: function() {
        self.socket.onclose = function() {
          resetConnectionParameters(self);
          self._machine.transition('permanentlyClosed');
        };

        self.socket.close();
      },

      failedPre: function() {
        triggerStateChange('failed');
        Pusher.debug('WebSockets are not available in this browser.');
      }
    });

    /*-----------------------------------------------
      -----------------------------------------------*/

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

      self.connectionAttempts++;
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
      self.emit(eventName, data);
    }

    function triggerStateChange(newState, data) {
      // avoid emitting and changing the state
      // multiple times when it's the same.
      if (self.state === newState) return;

      var prevState = self.state;

      self.state = newState;

      Pusher.debug('State changed', prevState + ' -> ' + newState);

      self.emit('state_change', {previous: prevState, current: newState});
      self.emit(newState, data);
    }
  };

  Connection.prototype.connect = function() {
    // no WebSockets
    if (Pusher.Transport === null) {
      this._machine.transition('failed');
    }
    // initial open of connection
    else if(this._machine.is('initialized')) {
      resetConnectionParameters(this);
      this._machine.transition('waiting');
    }
    // user skipping connection wait
    else if (this._machine.is('waiting') && this.netInfo.isOnLine() === true) {
      this._machine.transition('connecting');
    }
    // user re-opening connection after closing it
    else if(this._machine.is("permanentlyClosed")) {
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
    if (this._machine.is('permanentlyClosed')) {
      return;
    }

    Pusher.debug('Disconnecting');

    if (this._machine.is('waiting')) {
      this._machine.transition('permanentlyClosed');
    } else {
      this._machine.transition('permanentlyClosing');
    }
  };

  Pusher.Util.extend(Connection.prototype, Pusher.EventsDispatcher.prototype);
  this.Pusher.Connection = Connection;
}).call(this);
