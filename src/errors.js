var Util = require('./util');

function buildExceptionClass(name) {
  var constructor = function(message) {
    Error.call(this, message);
    this.name = name;
  };
  Util.extend(constructor.prototype, Error.prototype);

  return constructor;
}

/** Error classes used throughout pusher-js library. */
module.exports = {
  BadEventName: buildExceptionClass("BadEventName"),
  RequestTimedOut: buildExceptionClass("RequestTimedOut"),
  TransportPriorityTooLow: buildExceptionClass("TransportPriorityTooLow"),
  TransportClosed: buildExceptionClass("TransportClosed"),
  UnsupportedTransport: buildExceptionClass("UnsupportedTransport"),
  UnsupportedStrategy: buildExceptionClass("UnsupportedStrategy")
};
