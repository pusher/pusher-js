(function() {
  function JSONPRequest(options) {
    this.options = options;
  }
  var prototype = JSONPRequest.prototype;

  JSONPRequest.send = function(options, callback) {
    var request = new Pusher.JSONPRequest(options);
    var receiver = options.receivers.create(function(error, result) {
      options.receivers.remove(receiver);
      request.cleanup();
      callback(error, result);
    });
    request.send(options.data, receiver);
    return request;
  };

  prototype.send = function(data, receiver) {
    if (this.request) {
      return;
    }

    var params = Pusher.Util.filterObject(
      Pusher.Util.extend({}, data, { receiver: receiver.name }),
      function(value) { return value !== undefined;}
    );
    var query = Pusher.Util.map(
      Pusher.Util.flatten(encodeParamsObject(params)),
      Pusher.Util.method("join", "=")
    ).join("&");
    var url = this.options.url + "/" + receiver.id + "?" + query;

    this.request = new Pusher.ScriptRequest(url, receiver);
    this.request.send();
  };

  prototype.cleanup = function() {
    if (this.request) {
      this.request.cleanup();
    }
  };

  function encodeParamsObject(data) {
    return Pusher.Util.mapObject(data, function(value) {
      if (typeof value === "object") {
        value = JSON.stringify(value);
      }
      return encodeURIComponent(Pusher.Base64.encode(value.toString()));
    });
  }

  Pusher.JSONPRequest = JSONPRequest;
}).call(this);
