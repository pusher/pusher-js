(function() {

  function JSONPSender(options) {
    this.receiver = options.receiver;
    this.options = options;
  }

  var prototype = JSONPSender.prototype;

  prototype.send = function(data, callback) {
    var request = new Pusher.JSONPRequest({
      url: this.options.url,
      receiver: this.options.receiverName,
      tagPrefix: this.options.tagPrefix
    });
    var id = this.receiver.register(function(error, result) {
      request.cleanup();
      callback(error, result);
    });

    var self = this;
    request.send(id, data, function(error) {
      var callback = self.receiver.unregister(id);
      if (callback) {
        callback(error);
      }
    });
  };

  Pusher.JSONPSender = JSONPSender;

}).call(this);
