;(function() {
  /**
   * Provides Pusher protocol interface for transports.
   *
   * Emits following events:
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
   * @param {Number} id
   * @param {AbstractTransport} transport
   */
  function Connection(id, transport) {
    Pusher.EventsDispatcher.call(this);

    this.id = id;
    this.transport = transport;
    this.bindListeners();
  }
  var prototype = Connection.prototype;
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
    var message = { event: name, data: data };
    if (channel) {
      message.channel = channel;
    }
    return this.send(Pusher.Protocol.encodeMessage(message));
  };

  /** Closes the connection. */
  prototype.close = function() {
    this.transport.close();
  };

  /** @private */
  prototype.bindListeners = function() {
    var self = this;

    var onMessage = function(m) {
      var message;
      try {
        message = Pusher.Protocol.decodeMessage(m);
      } catch(e) {
        self.emit('error', {
          type: 'MessageParseError',
          error: e,
          data: m.data
        });
      }

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
    var onPingRequest = function() {
      self.emit("ping_request");
    };
    var onError = function(error) {
      self.emit("error", { type: "WebSocketError", error: error });
    };
    var onClosed = function(closeEvent) {
      unbindListeners();

      if (closeEvent && closeEvent.code) {
        self.handleCloseEvent(closeEvent);
      }

      self.transport = null;
      self.emit("closed");
    };

    var unbindListeners = function() {
      self.transport.unbind("closed", onClosed);
      self.transport.unbind("error", onError);
      self.transport.unbind("ping_request", onPingRequest);
      self.transport.unbind("message", onMessage);
    };

    self.transport.bind("message", onMessage);
    self.transport.bind("ping_request", onPingRequest);
    self.transport.bind("error", onError);
    self.transport.bind("closed", onClosed);
  };

  /** @private */
  prototype.handleCloseEvent = function(closeEvent) {
    var action = Pusher.Protocol.getCloseAction(closeEvent);
    var error = Pusher.Protocol.getCloseError(closeEvent);
    if (error) {
      this.emit('error', error);
    }
    if (action) {
      this.emit(action);
    }
  };

  Pusher.Connection = Connection;
}).call(this);
