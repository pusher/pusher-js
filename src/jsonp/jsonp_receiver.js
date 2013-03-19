(function() {

  function JSONPReceiver() {
    this.lastId = 0;
    this.callbacks = {};
  }

  var prototype = JSONPReceiver.prototype;

  prototype.register = function(callback) {
    this.lastId++;
    var id = this.lastId;
    this.callbacks[id] = callback;
    return id;
  };

  prototype.unregister = function(id) {
    if (this.callbacks[id]) {
      var callback = this.callbacks[id];
      delete this.callbacks[id];
      return callback;
    } else {
      return null;
    }
  };

  prototype.receive = function(id, error, data) {
    var callback = this.unregister(id);
    if (callback) {
      callback(error, data);
    }
  };

  Pusher.JSONPReceiver = JSONPReceiver;
  Pusher.JSONP = new JSONPReceiver();

}).call(this);
