(function() {
  function Transport(hooks) {
    this.hooks = hooks;
    this.isSupported = this.hooks.isSupported;
  }
  var prototype = Transport.prototype;

  prototype.createConnection = function(name, priority, key, options) {
    return new Pusher.TransportConnection(
      this.hooks, name, priority, key, options
    );
  };

  Pusher.Transport = Transport;
}).call(this);
