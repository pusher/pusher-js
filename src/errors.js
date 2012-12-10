;(function() {
  function buildExceptionClass(name) {
    var klass = function(message) {
      Error.call(this, message);
      this.name = name;
    };
    Pusher.Util.extend(klass.prototype, Error.prototype);

    return klass;
  }

  Pusher.Errors = {
    UnsupportedTransport: buildExceptionClass("UnsupportedTransport"),
    UnsupportedStrategy: buildExceptionClass("UnsupportedStrategy"),
    TransportClosed: buildExceptionClass("TransportClosed")
  };
}).call(this);
