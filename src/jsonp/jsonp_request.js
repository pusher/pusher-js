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
    var query = Pusher.Util.map(
      Pusher.Util.flatten(encodeData(params)), Pusher.Util.method("join", "=")
    ).join("&");

    var script = document.createElement("script");
    script.id = this.options.prefix + this.id;
    script.src = this.options.url + "/" + this.id + "?" + query;
    script.type = "text/javascript";
    script.charset = "UTF-8";

    var head = document.getElementsByTagName('head')[0];
    head.insertBefore(script, head.firstChild);

    return true;
  };

  function encodeData(data, path) {
    var result = {};

    if (typeof data === "object") {
      Pusher.Util.objectApply(data, function(value, key) {
        Pusher.Util.extend(
          result,
          encodeData(value, Pusher.Util.filter([path, key]).join("."))
        );
      });
    } else if (data !== undefined) {
      result[path] = encodeURIComponent(data.toString());
    }

    return result;
  }

  Pusher.JSONPRequest = JSONPRequest;

}).call(this);
