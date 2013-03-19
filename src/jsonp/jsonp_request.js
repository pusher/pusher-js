(function() {

  function JSONPRequest(options) {
    this.options = options;
  }

  JSONPRequest.send = function(options, callback) {
    var request = new Pusher.JSONPRequest({
      url: options.url,
      receiver: options.receiverName,
      tagPrefix: options.tagPrefix
    });
    var id = options.receiver.register(function(error, result) {
      request.cleanup();
      callback(error, result);
    });

    return request.send(id, options.data, function(error) {
      var callback = options.receiver.unregister(id);
      if (callback) {
        callback(error);
      }
    });
  };

  var prototype = JSONPRequest.prototype;

  prototype.send = function(id, data, callback) {
    if (this.script) {
      return false;
    }

    var tagPrefix = this.options.tagPrefix || "_pusher_jsonp_";

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
    this.script.id = tagPrefix + id;
    this.script.src = this.options.url + "/" + id + "?" + query;
    this.script.type = "text/javascript";
    this.script.charset = "UTF-8";
    this.script.onerror = this.script.onload = callback;

    // Opera<11.6 hack for missing onerror callback
    if (this.script.async === undefined && document.attachEvent) {
      if (/opera/i.test(navigator.userAgent)) {
        var receiverName = this.options.receiver || "Pusher.JSONP.receive";
        this.errorScript = document.createElement("script");
        this.errorScript.text = receiverName + "(" + id + ", true);";
        this.script.async = this.errorScript.async = false;
      }
    }

    var self = this;
    this.script.onreadystatechange = function() {
      if (self.script && /loaded|complete/.test(self.script.readyState)) {
        callback(true);
      }
    };

    var head = document.getElementsByTagName('head')[0];
    head.insertBefore(this.script, head.firstChild);
    if (this.errorScript) {
      head.insertBefore(this.errorScript, this.script.nextSibling);
    }

    return true;
  };

  prototype.cleanup = function() {
    if (this.script && this.script.parentNode) {
      this.script.parentNode.removeChild(this.script);
      this.script = null;
    }
    if (this.errorScript && this.errorScript.parentNode) {
      this.errorScript.parentNode.removeChild(this.errorScript);
      this.errorScript = null;
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
