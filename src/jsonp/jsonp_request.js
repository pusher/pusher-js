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
      Pusher.Util.flatten(
        encodeData(
          Pusher.Util.filterObject(params, function(value) {
            return value !== undefined;
          })
        )
      ),
      Pusher.Util.method("join", "=")
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

  function encodeData(data) {
    return Pusher.Util.mapObject(data, function(value) {
      if (typeof value === "object") {
        value = JSON.stringify(value);
      }
      return encodeURIComponent(Pusher.Base64.encode(value.toString()));
    });
  }

  Pusher.JSONPRequest = JSONPRequest;

}).call(this);
