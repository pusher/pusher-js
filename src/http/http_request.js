;(function() {
  var MAX_BUFFER_LENGTH = 256*1024;

  function HTTPRequest(hooks, method, url) {
    Pusher.EventsDispatcher.call(this);

    this.hooks = hooks;
    this.method = method;
    this.url = url;
  }
  var prototype = HTTPRequest.prototype;
  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  prototype.start = function(payload) {
    var self = this;

    self.position = 0;
    self.xhr = self.hooks.getRequest(self);

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
      this.hooks.abortRequest(this.xhr);
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
    if (this.isBufferTooLong(data)) {
      this.emit("buffer_too_long");
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

  prototype.isBufferTooLong = function(buffer) {
    return this.position === buffer.length && buffer.length > MAX_BUFFER_LENGTH;
  };

  Pusher.HTTP.Request = HTTPRequest;
}).call(this);
