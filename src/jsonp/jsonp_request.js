(function() {

  function JSONPRequest(id, options) {
    this.id = id;
    this.options = options;
  }

  var prototype = JSONPRequest.prototype;

  prototype.send = function(data, callback) {
    if (this.script) {
      return false;
    }

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

    this.script = document.createElement("script");
    this.script.id = this.options.prefix + this.id;
    this.script.src = this.options.url + "/" + this.id + "?" + query;
    this.script.type = "text/javascript";
    this.script.async = true;
    this.script.charset = "UTF-8";
    this.script.onerror = this.script.onload = callback;

    var head = document.getElementsByTagName('head')[0];
    head.insertBefore(this.script, head.firstChild);

    return true;
  };

  prototype.cleanup = function() {
    if (this.script && this.script.parentNode) {
      this.script.parentNode.removeChild(this.script);
      this.script = null;
    }
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
