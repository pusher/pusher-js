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
      try {
        var result = Pusher.Protocol.processHandshake(m);
        if (result.action === "connected") {
          self.finish("connected", {
            connection: new Pusher.Connection(result.id, self.transport)
          });
        } else {
          self.finish(result.action, { error: result.error });
          self.transport.close();
        }
      } catch (e) {
        self.finish("error", { error: e });
        self.transport.close();
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
