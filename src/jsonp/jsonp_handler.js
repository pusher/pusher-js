(function() {

  function JSONPHandler(options) {
    this.index = 0;
    this.callbacks = {};
    this.options = options;
  }

  var prototype = JSONPHandler.prototype;

  prototype.send = function(data, callback) {
    this.index++;

    var id = this.index;
    var request = new Pusher.JSONPRequest(id, this.options);

    this.callbacks[id] = function(error, result) {
      runner.cleanup();
      callback(error, result);
    };

    var runner = request.send(data);
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
