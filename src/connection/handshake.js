var Util = require('../util');
var Protocol = require('./protocol');
var Connection = require('./connection');

/**
 * Handles Pusher protocol handshakes for transports.
 *
 * Calls back with a result object after handshake is completed. Results
 * always have two fields:
 * - action - string describing action to be taken after the handshake
 * - transport - the transport object passed to the constructor
 *
 * Different actions can set different additional properties on the result.
 * In the case of 'connected' action, there will be a 'connection' property
 * containing a Connection object for the transport. Other actions should
 * carry an 'error' property.
 *
 * @param {AbstractTransport} transport
 * @param {Function} callback
 */
function Handshake(transport, callback) {
  this.transport = transport;
  this.callback = callback;
  this.bindListeners();
}
var prototype = Handshake.prototype;

prototype.close = function() {
  this.unbindListeners();
  this.transport.close();
};

/** @private */
prototype.bindListeners = function() {
  var self = this;

  self.onMessage = function(m) {
    self.unbindListeners();

    try {
      var result = Protocol.processHandshake(m);
      if (result.action === "connected") {
        self.finish("connected", {
          connection: new Connection(result.id, self.transport),
          activityTimeout: result.activityTimeout
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

  self.onClosed = function(closeEvent) {
    self.unbindListeners();

    var action = Protocol.getCloseAction(closeEvent) || "backoff";
    var error = Protocol.getCloseError(closeEvent);
    self.finish(action, { error: error });
  };

  self.transport.bind("message", self.onMessage);
  self.transport.bind("closed", self.onClosed);
};

/** @private */
prototype.unbindListeners = function() {
  this.transport.unbind("message", this.onMessage);
  this.transport.unbind("closed", this.onClosed);
};

/** @private */
prototype.finish = function(action, params) {
  this.callback(
    Util.extend({ transport: this.transport, action: action }, params)
  );
};

module.exports = Handshake;
