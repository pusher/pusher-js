;(function() {
  function buildExceptionClass(name) {
    var klass = function(message) {
      Error.call(this, message);
      this.name = name;
    };
    Pusher.Util.extend(klass.prototype, Error.prototype);

    return klass;
  }

  /** Error classes used throughout pusher-js library. */
  Pusher.Errors = {
    BadEventName: buildExceptionClass("BadEventName"),
    UnsupportedTransport: buildExceptionClass("UnsupportedTransport"),
    UnsupportedStrategy: buildExceptionClass("UnsupportedStrategy"),
    TransportPriorityTooLow: buildExceptionClass("TransportPriorityTooLow"),
    TransportClosed: buildExceptionClass("TransportClosed")
  };
}).call(this);
