var Util = require('../util');
var EventsDispatcher = require('../events_dispatcher');
var Protocol = require('./protocol');
var Logger = require('../logger');

/**
 * Provides Pusher protocol interface for transports.
 *
 * Emits following events:
 * - message - on received messages
 * - ping - on ping requests
 * - pong - on pong responses
 * - error - when the transport emits an error
 * - closed - after closing the transport
 *
 * It also emits more events when connection closes with a code.
 * See Protocol.getCloseAction to get more details.
 *
 * @param {Number} id
 * @param {AbstractTransport} transport
 */
function Connection(id, transport) {
  EventsDispatcher.call(this);

  this.id = id;
  this.transport = transport;
  this.activityTimeout = transport.activityTimeout;
  this.bindListeners();
}
var prototype = Connection.prototype;
Util.extend(prototype, EventsDispatcher.prototype);

/** Returns whether used transport handles activity checks by itself
 *
 * @returns {Boolean} true if activity checks are handled by the transport
 */
prototype.handlesActivityChecks = function() {
  return this.transport.handlesActivityChecks();
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
  Logger.debug('Event sent', message);
  return this.send(Protocol.encodeMessage(message));
};

/** Sends a ping message to the server.
 *
 * Basing on the underlying transport, it might send either transport's
 * protocol-specific ping or pusher:ping event.
 */
prototype.ping = function() {
  if (this.transport.supportsPing()) {
    this.transport.ping();
  } else {
    this.send_event('pusher:ping', {});
  }
};

/** Closes the connection. */
prototype.close = function() {
  this.transport.close();
};

/** @private */
prototype.bindListeners = function() {
  var self = this;

  var listeners = {
    message: function(m) {
      var message;
      try {
        message = Protocol.decodeMessage(m);
      } catch(e) {
        self.emit('error', {
          type: 'MessageParseError',
          error: e,
          data: m.data
        });
      }

      if (message !== undefined) {
        Logger.debug('Event recd', message);

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
    },
    activity: function() {
      self.emit("activity");
    },
    error: function(error) {
      self.emit("error", { type: "WebSocketError", error: error });
    },
    closed: function(closeEvent) {
      unbindListeners();

      if (closeEvent && closeEvent.code) {
        self.handleCloseEvent(closeEvent);
      }

      self.transport = null;
      self.emit("closed");
    }
  };

  var unbindListeners = function() {
    Util.objectApply(listeners, function(listener, event) {
      self.transport.unbind(event, listener);
    });
  };

  Util.objectApply(listeners, function(listener, event) {
    self.transport.bind(event, listener);
  });
};

/** @private */
prototype.handleCloseEvent = function(closeEvent) {
  var action = Protocol.getCloseAction(closeEvent);
  var error = Protocol.getCloseError(closeEvent);
  if (error) {
    this.emit('error', error);
  }
  if (action) {
    this.emit(action);
  }
};

module.exports = Connection;
