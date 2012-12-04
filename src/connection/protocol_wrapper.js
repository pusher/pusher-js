;(function() {

  function ProtocolWrapper(transport) {
    Pusher.EventsDispatcher.call(this);
    this.transport = transport;
    this.bindListeners();
  };
  var prototype = ProtocolWrapper.prototype;

  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  // interface

  prototype.supportsPing = function() {
    return this.transport.supportsPing();
  };

  prototype.send = function(data) {
    return this.transport.send(data);
  };

  prototype.send_event = function(name, data, channel) {
    var payload = {
      event: name,
      data: data
    };
    if (channel) {
      payload["channel"] = channel;
    }

    Pusher.debug('Event sent', payload); // TODO make debug nicer
    return this.send(JSON.stringify(payload))
  };

  prototype.close = function() {
    this.transport.close();
  };

  // private

  prototype.bindListeners = function() {
    var self = this;

    var onMessageOpen = function(message) {
      var message = self.parseMessage(message);

      if (message !== undefined) {
        if (message.event === 'pusher:connection_established') {
          self.id = message.data.socket_id;
          self.transport.unbind("message", onMessageOpen);
          self.transport.bind("message", onMessageConnected);
          self.emit("connected");
        } else if (message.event === 'pusher:error') {
          self.handleCloseCode(message.data.code, message.data.message)
        }
      }
    };
    var onMessageConnected = function(message) {
      message = self.parseMessage(message);

      if (message !== undefined) {
        // TODO make debug nicer
        Pusher.debug('Event recd', message);

        switch (message.event) {
          case 'pusher:error':
            self.emit('error', { type: 'PusherError', data: message.data });
            break;
          case 'pusher:ping':
            self.emit("ping");
            break;
          case 'pusher:pong':
            self.emit("pong");
            break;
        }
        self.emit('message', message);
      }
    };
    var onError = function(error) {
      self.emit("error", { type: "WebSocketError", error: error });
    };
    var onClosed = function() {
      self.transport.unbind("message", onMessageOpen);
      self.transport.unbind("message", onMessageConnected);
      self.transport.unbind("error", onError);
      self.transport.unbind("closed", onClosed);
      self.transport = null;
      self.emit("closed")
    };

    this.transport.bind("message", onMessageOpen);
    this.transport.bind("error", onError);
    this.transport.bind("closed", onClosed);
  };

  prototype.parseMessage = function(message) {
    try {
      var params = JSON.parse(message.data);

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
      this.emit(
        'error', { type: 'MessageParseError', error: e, data: message.data}
      );
    }
  };

  prototype.handleCloseCode = function(code, message) {
    this.emit(
      'error', { type: 'PusherError', data: { code: code, message: message } }
    );

    if (code === 4000) {
      this.emit("ssl_only");
    } else if (code < 4100) {
      this.emit("refused");
    } else if (code < 4200) {
      this.emit("backoff");
    } else if (code < 4300) {
      this.emit("retry");
    }
    this.transport.close();
  }

  Pusher.ProtocolWrapper = ProtocolWrapper;
}).call(this);
