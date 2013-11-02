;(function() {
  function HTTPCORSRequest(method, url) {
    Pusher.EventsDispatcher.call(this);

    this.method = method;
    this.url = url;
    this.xhr = new window.XMLHttpRequest();
    this.position = 0;
  }
  var prototype = HTTPCORSRequest.prototype;
  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  prototype.start = function(payload) {
    var self = this;

    self.xhr.onreadystatechange = function() {
      switch (self.xhr.readyState) {
        case 3:
          if (self.xhr.responseText && self.xhr.responseText.length > 0) {
            self.onChunk(self.xhr.status, self.xhr.responseText);
          }
          break;
        case 4:
          // this happens only on errors, never after calling close
          self.onChunk(self.xhr.status, self.xhr.responseText);
          self.emit("finished", self.xhr.status);
          self.close();
          break;
      }
    };

    self.unloader = function() {
      self.close();
    };
    Pusher.Util.addWindowListener("unload", self.unloader);

    self.xhr.open(self.method, self.url, true);
    self.xhr.send(payload);
  };

  prototype.close = function() {
    if (this.unloader) {
      Pusher.Util.removeWindowListener("unload", this.unloader);
      this.unloader = null;
    }
    if (this.xhr) {
      this.xhr.onreadystatechange = null;
      this.xhr.abort();
      this.xhr = null;
    }
  };

  prototype.onChunk = function(status, data) {
    while (true) {
      var chunk = this.advanceBuffer(data);
      if (chunk) {
        this.emit("chunk", { status: status, data: chunk });
      } else {
        break;
      }
    }
  };

  prototype.advanceBuffer = function(buffer) {
    var unreadData = buffer.slice(this.position);
    var endOfLinePosition = unreadData.indexOf("\n");

    if (endOfLinePosition !== -1) {
      this.position += endOfLinePosition + 1;
      return unreadData.slice(0, endOfLinePosition);
    } else {
      // chunk is not finished yet, don't move the buffer pointer
      return null;
    }
  };

  Pusher.HTTPCORSRequest = HTTPCORSRequest;
}).call(this);
