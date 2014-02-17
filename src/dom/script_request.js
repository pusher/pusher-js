(function() {
  function ScriptRequest(src) {
    this.src = src;
  }
  var prototype = ScriptRequest.prototype;

  prototype.send = function(receiver) {
    var self = this;

    self.script = document.createElement("script");
    self.script.id = receiver.id;
    self.script.src = self.src;
    self.script.type = "text/javascript";
    self.script.charset = "UTF-8";

    self.script.onerror = function() {
      receiver.callback("Error loading script " + self.src);
    };
    self.script.onload = function() {
      receiver.callback(null);
    };

    // Opera<11.6 hack for missing onerror callback
    if (self.script.async === undefined && document.attachEvent &&
        /opera/i.test(navigator.userAgent)) {
      self.errorScript = document.createElement("script");
      self.errorScript.id = receiver.id + "_error";
      self.errorScript.text = receiver.name + "(true);";
      self.script.async = self.errorScript.async = false;
    } else {
      self.script.async = true;
    }

    self.script.onreadystatechange = function() {
      if (self.script && /loaded|complete/.test(self.script.readyState)) {
        receiver.callback(null);
      }
    };

    var head = document.getElementsByTagName('head')[0];
    head.insertBefore(self.script, head.firstChild);
    if (self.errorScript) {
      head.insertBefore(self.errorScript, self.script.nextSibling);
    }
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

  Pusher.ScriptRequest = ScriptRequest;
}).call(this);
