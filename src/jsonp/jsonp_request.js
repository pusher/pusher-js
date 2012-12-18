(function() {

  function JSONPRequest(id, options) {
    this.id = id;
    this.options = options;
  }

  var prototype = JSONPRequest.prototype;

  prototype.send = function(data) {
    var params = Pusher.Util.extend(
      {}, data, { receiver: this.options.receiver }
    );
    var query = Pusher.Util.map(Pusher.Util.flatten(params), function(pair) {
      return pair[0] + "=" + encodeValue(pair[1]);
    }).join("&");

    var script = document.createElement("script");
    script.id = this.options.prefix + this.id;
    script.src = this.options.url + "/" + this.id + "?" + query;
    script.type = "text/javascript";
    script.charset = "UTF-8";

    var head = document.getElementsByTagName('head')[0];
    head.insertBefore(script, head.firstChild);

    return true;
  };

  prototype.receive = function(error, result, callback) {
    callback(error, Pusher.Util.mapObject(result, decodeValue));
  }

  function encodeValue(value) {
    if (typeof value === "object") {
      value = JSON.stringify(value);
    }
    return encodeURIComponent(value);
  }

  function decodeValue(value) {
    try {
      return JSON.parse(value);
    } catch(e) {
      return value;
    }
  }

  Pusher.JSONPRequest = JSONPRequest;

}).call(this);
