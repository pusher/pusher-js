;(function() {

  function ConnectionManager(key, options) {
    Pusher.EventsDispatcher.call(this);

    this.options = options || {};
    this.state = "initialized";
    this.connection = null;

    this.strategy = Pusher.StrategyBuilder.build(
      Pusher.Util.extend(Pusher.defaultStrategy, { key: key })
    );

    var self = this;

    Pusher.NetInfo.bind("online", function() {
      if (self.state === "unavailable") {
        self.connect();
      }
    });
    Pusher.NetInfo.bind("offline", function() {
      if (self.shouldRetry()) {
        self.disconnect();
        self.updateState("unavailable");
      }
    });
  }
  var prototype = ConnectionManager.prototype;

  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  // interface

  prototype.connect = function() {
    if (this.connection) {
      return;
    }
    if (this.state === "connecting") {
      return;
    }
    if (!this.strategy.isSupported()) {
      this.updateState("failed");
      return;
    }
    if (Pusher.NetInfo.isOnline() === false) {
      this.updateState("unavailable");
      return;
    }

    this.updateState("connecting");
    this.runner = this.strategy.connect(function(error, transport) {
      // we don't support switching connections yet
      self.runner.abort();
      self.clearUnavailableTimer();
      self.setConnection(self.wrapTransport(transport));
    });

    var self = this;
    this.unavailableTimer = setTimeout(function() {
      if (!self.unavailableTimer) {
        return;
      }
      self.updateState("unavailable");
      self.unavailableTimer = null;
    }, this.options.unavailableTimeout);
  };

  prototype.send = function(data) {
    if (this.connection) {
      return this.connection.send(data);
    } else {
      return false;
    }
  };

  prototype.send_event = function(name, data, channel) {
    if (this.connection) {
      return this.connection.send_event(name, data, channel);
    } else {
      return false;
    }
  };

  prototype.disconnect = function(data) {
    if (this.runner) {
      this.runner.abort();
    }
    this.clearUnavailableTimer();
    this.stopActivityCheck();
    this.updateState("disconnected");
    // we're in disconnected state, so closing will not cause reconnecting
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
  };

  // private

  // TODO implement delay
  prototype.retryIn = function() {
    this.disconnect();
    this.connect();
  };

  prototype.clearUnavailableTimer = function() {
    if (this.unavailableTimer) {
      clearTimeout(this.unavailableTimer);
      this.unavailableTimer = null;
    }
  };

  prototype.resetActivityCheck = function() {
    this.stopActivityCheck();
    // send ping after inactivity
    if (!this.connection.supportsPing()) {
      var self = this;
      this.activityTimer = setTimeout(function() {
        self.send_event('pusher:ping', {});
        // wait for pong response
        self.activityTimer = setTimeout(function() {
          self.connection.close();
        }, (self.options.pongTimeout));
      }, (this.options.activityTimeout));
    }
  };

  prototype.stopActivityCheck = function() {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  };

  prototype.setConnection = function(connection) {
    this.connection = connection;

    var self = this;
    var onConnected = function(id) {
      self.socket_id = id;
      self.updateState("connected");
      self.resetActivityCheck();
    };
    var onMessage = function(message) {
      // includes pong messages from server
      self.resetActivityCheck();
      self.emit('message', message);
    };
    var onPing = function() {
      self.send_event('pusher:pong', {});
    };
    var onError = function() {
      // just emit error to user - socket will already be closed by browser
      self.emit("error", { type: "WebSocketError", error: error });
    };
    var onClosed = function() {
      connection.unbind("connected", onConnected);
      connection.unbind("message", onMessage);
      connection.unbind("ping", onPing);
      connection.unbind("error", onError);
      connection.unbind("closed", onClosed);
      self.connection = null;

      if (self.shouldRetry()) {
        self.retryIn(0);
      }
    };

    // handling close conditions
    var onSSLOnly = function(id) {
      self.strategy = self.strategy.getEncrypted();
      self.retryIn(0);
    };
    var onRefused = function(id) {
      self.disconnect();
    };
    var onRetry = function(id) {
      self.retryIn(0);
    };

    connection.bind("connected", onConnected);
    connection.bind("message", onMessage);
    connection.bind("ping", onPing);
    connection.bind("error", onError);
    connection.bind("closed", onClosed);

    connection.bind("ssl_only", onSSLOnly);
    connection.bind("refused", onRefused);
    connection.bind("retry", onRetry);

    this.resetActivityCheck();
  };

  prototype.updateState = function(newState, data) {
    var previousState = this.state;

    this.state = newState;
    // Only emit when the state changes
    if (previousState !== newState) {
      // TODO nicer debug
      Pusher.debug('State changed', previousState + ' -> ' + newState);

      this.emit('state_change', { previous: previousState, current: newState });
      this.emit(newState, data);
    }
  };

  prototype.shouldRetry = function() {
    return this.state === "connecting" || this.state === "connected";
  }

  prototype.wrapTransport = function(transport) {
    return new Pusher.ProtocolWrapper(transport);
  };

  Pusher.ConnectionManager = ConnectionManager;
}).call(this);
