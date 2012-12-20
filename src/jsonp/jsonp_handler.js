(function() {

  function JSONPHandler(options) {
    this.index = 0;
    this.callbacks = {};
    this.options = options;
  }

  var prototype = JSONPHandler.prototype;

  prototype.send = function(data, callback) {
    this.index++;

    var self = this;
    var id = this.index;
    var request = new Pusher.JSONPRequest(id, this.options);
    var runner;

    this.callbacks[id] = function(error, result) {
      request.cleanup();
      callback(error, result);
    };

    request.send(data, function(error) {
      if (self.callbacks[id]) {
        self.callbacks[id](error);
        delete self.callbacks[id];
      }
    });
  };

  prototype.receive = function(id, data) {
    if (this.callbacks[id]) {
      this.callbacks[id](null, data);
      delete this.callbacks[id];
    }
  };

  Pusher.JSONPHandler = JSONPHandler;
  Pusher.JSONP = new JSONPHandler({
    url: "http://localhost:4567/jsonp",
    prefix: "_pusher_jsonp_"
  });

}).call(this);
