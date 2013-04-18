;(function() {
  function Handshake(transport, callback) {
    this.transport = transport;
    this.callback = callback;
    this.bindListeners();
  }
  var prototype = Handshake.prototype;

  /** @private */
  prototype.bindListeners = function() {
    var self = this;

    var unbindListeners = function() {
      self.transport.unbind("message", onMessage);
      self.transport.unbind("closed", onClosed);
    };
    var onMessage = function(m) {
      unbindListeners();

      var message;
      try {
        message = Pusher.Protocol.decodeMessage(m);
      } catch (e) {
        self.finish("error", { error: e });
        return;
      }

      if (message.event === "pusher:connection_established") {
        var id = message.data.socket_id;
        self.finish("connected", {
          connection: new Pusher.Connection(id, self.transport)
        });
      } else if (message.event === "pusher:error") {
        // From protocol 6 close codes are sent only once, so this only
        // happens when connection does not support close codes
        var action = Pusher.Protocol.getCloseAction(message.data);
        var error = Pusher.Protocol.getCloseError(message.data);
        self.finish(action, { error: error });
        self.transport.close();
      } else {
        self.finish("error", {});
      }
    };
    var onClosed = function(closeEvent) {
      unbindListeners();

      var action = Pusher.Protocol.getCloseAction(closeEvent);
      var error = Pusher.Protocol.getCloseError(closeEvent);
      self.finish(action, { error: error });
    };

    self.transport.bind("message", onMessage);
    self.transport.bind("closed", onClosed);
  };

  /** @private */
  prototype.finish = function(action, params) {
    this.callback(
      Pusher.Util.extend({ transport: this.transport, action: action }, params)
    );
  };

  Pusher.Handshake = Handshake;
}).call(this);
