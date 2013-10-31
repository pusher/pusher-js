;(function() {
  function XDRRequest(url) {
    Pusher.EventsDispatcher.call(this);

    this.url = url;
    this.xdr = new window.XDomainRequest();
    this.position = 0;
  }
  var prototype = XDRRequest.prototype;
  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  prototype.start = function(payload) {
    var self = this;

    self.xdr.ontimeout = self.xdr.onerror = function() {
      self.emit("finished", null);
      self.close();
    };
    self.xdr.onprogress = function() {
      self.onChunk(200, self.xdr.responseText);
    };
    self.xdr.onload = function() {
      self.onChunk(200, self.xdr.responseText);
      self.emit("finished", 200);
      self.close();
    };

    self.xdr.open("POST", self.url, true);
    self.xdr.send(payload);
  };

  prototype.close = function() {
    if (this.xdr) {
      this.xdr.ontimeout = this.xdr.onerror = null;
      this.xdr.onprogress = this.xdr.onload = null;
      this.xdr.abort();
      this.xdr = null;
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

  Pusher.XDRRequest = XDRRequest;
}).call(this);
