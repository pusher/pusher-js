;(function() {
  /**
   * Provides Pusher protocol interface for transports.
   *
   * Emits following events:
   * - connected - after establishing connection and receiving a socket id
   * - message - on received messages
   * - ping - on ping requests
   * - pong - on pong responses
   * - error - when the transport emits an error
   * - closed - after closing the transport
   * - ssl_only - after trying to connect without ssl to a ssl-only app
   * - retry - when closed connection should be retried immediately
   * - backoff - when closed connection should be retried with a delay
   * - refused - when closed connection should not be retried
   *
   * @param {AbstractTransport} transport
   */
  function ProtocolWrapper(transport) {
    Pusher.EventsDispatcher.call(this);
    this.transport = transport;
    this.bindListeners();
  }
  var prototype = ProtocolWrapper.prototype;

  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  /** Returns whether used transport handles ping/pong by itself
   *
   * @returns {Boolean} true if ping is handled by the transport
   */
  prototype.supportsPing = function() {
    return this.transport.supportsPing();
  };

  /** Sends raw data.
   *
   * @param {String} data
   */
  prototype.send = function(data) {
    return this.transport.send(data);
  };

  /** Sends an event.
   *
   * @param {String} name
   * @param {String} data
   * @param {String} [channel]
   * @returns {Boolean} whether message was sent or not
   */
  prototype.send_event = function(name, data, channel) {
    var payload = {
      event: name,
      data: data
    };
    if (channel) {
      payload.channel = channel;
    }

    Pusher.debug('Event sent', payload);
    return this.send(JSON.stringify(payload));
  };

  /** Closes the transport.  */
  prototype.close = function() {
    this.transport.close();
  };

  /** @private */
  prototype.bindListeners = function() {
    var self = this;

    var onMessageOpen = function(message) {
      message = self.parseMessage(message);

      if (message !== undefined) {
        if (message.event === 'pusher:connection_established') {
          self.id = message.data.socket_id;
          self.transport.unbind("message", onMessageOpen);
          self.transport.bind("message", onMessageConnected);
          self.emit("connected", self.id);
        } else if (message.event === 'pusher:error') {
          self.handleCloseCode(message.data.code, message.data.message);
        }
      }
    };
    var onMessageConnected = function(message) {
      message = self.parseMessage(message);

      if (message !== undefined) {
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
      self.emit("closed");
    };

    this.transport.bind("message", onMessageOpen);
    this.transport.bind("error", onError);
    this.transport.bind("closed", onClosed);
  };

  /** @private */
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

  /** @private */
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
    } else {
      // unknown error
      this.emit("refused");
    }
    this.transport.close();
  };

  Pusher.ProtocolWrapper = ProtocolWrapper;
}).call(this);
