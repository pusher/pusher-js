;(function() {
  function Handshake(transport, callback) {
    this.transport = transport;
    this.callback = callback;
    this.setResult(undefined);
    this.bindListeners();
  }
  var prototype = Handshake.prototype;

  prototype.process = function(handlers) {
    var handler = handlers[this.result.type];
    if (handler) {
      handler.apply(handler, this.result.params);
    }
  };

  /** @private */
  prototype.bindListeners = function() {
    var self = this;

    var unbindListeners = function() {
      self.transport.unbind("message", onMessage);
      self.transport.unbind("closed", onClosed);
    };
    var onMessage = function(m) {
      var message;

      try {
        message = Pusher.Protocol.parseMessage(m);
      } catch (e) {
        self.setResult("error", e);
        return;
      }

      if (message.event === "pusher:connection_established") {
        var id = message.data.socket_id;
        self.setResult("connected", new Pusher.Connection(id, self.transport));
      } else if (message.event === "pusher:error") {
        // From protocol 6 close codes are sent only once, so this only
        // happens when connection does not support close codes
        var action = Pusher.Protocol.getCloseAction(message.data);
        var error = Pusher.Protocol.getCloseError(message.data);
        self.setResult(action, error);
        self.transport.close();
      } else {
        self.setResult("error");
      }

      unbindListeners();
      self.callback();
    };
    var onClosed = function(closeEvent) {
      var action = Pusher.Protocol.getCloseAction(closeEvent);
      var error = Pusher.Protocol.getCloseError(closeEvent);
      unbindListeners();
      self.setResult(action, error);
      self.callback();
    };

    self.transport.bind("message", onMessage);
    self.transport.bind("closed", onClosed);
  };

  /** @private */
  prototype.setResult = function(type) {
    this.result = {
      type: type,
      params: Array.prototype.slice.call(arguments, 1)
    };
  };

  Pusher.Handshake = Handshake;
}).call(this);
