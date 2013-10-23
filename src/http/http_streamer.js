;(function() {

  var CONNECTING = 0;
  var OPEN = 1;
  var CLOSING = 2;
  var CLOSED = 3;

  function HTTPStreamer(url) {
    var self = this;

    self.url = getBaseURL(url);
    self.readyState = CONNECTING;

    self.bufferPosition = 0;
    self.xhr = createXHR();

    self.xhr.onreadystatechange = function() {
      switch (self.xhr.readyState) {
        case 3:
          if (self.xhr.responseText && self.xhr.responseText.length > 0) {
            self.onChunk(self.xhr.status, self.xhr.responseText);
          }
          break;
        case 4:
          self.onFinish(self.xhr.status, self.xhr.responseText);
          self.cleanUp(false);
          break;
      }
    };

    try {
      self.xhr.open("POST", getUniqueURL(self.url + "/xhr_streaming"), true);
      self.xhr.send();
    } catch(error) {
      setTimeout(function() {
        self.onError(error);
        self.cleanUp(false);
      }, 0)
      return;
    };
  }
  var prototype = HTTPStreamer.prototype;

  prototype.send = function(payload) {
    return this.sendRaw(JSON.stringify([payload]));
  };

  prototype.close = function(code, reason) {
    this.cleanUp(true);
  };

  prototype.sendRaw = function(payload) {
    if (this.readyState === OPEN) {
      try {
        var xhr = createXHR();
        xhr.open("POST", getUniqueURL(this.url + "/xhr_send"), true);
        xhr.send(payload);
        return true;
      } catch(e) {
        return false;
      }
    } else {
      return false;
    }
  };

  prototype.cleanUp = function(abort) {
    if (this.xhr) {
      this.xhr.onreadystatechange = function() {};
      if (abort) {
        this.xhr.abort();
      }
      this.xhr = null;
    }
    this.readyState = CLOSED;
  };

  prototype.onChunk = function(status, data) {
    if (status === 200) {
      while (true) {
        var event = this.advanceBuffer(data);
        if (event) {
          this.onInternalEvent(event);
        } else {
          break;
        }
      }
    }
  };

  prototype.onFinish = function(status, data) {
    this.onChunk(status, data);
  };

  prototype.onInternalEvent = function(data) {
    var type = data.slice(0, 1);
    var payload;
    switch(type) {
      case 'o':
        payload = JSON.parse(data.slice(1) || '{}');
        this.onOpen(payload);
        break;
      case 'a':
        payload = JSON.parse(data.slice(1) || '[]');
        for (var i = 0; i < payload.length; i++){
          this.onEvent(payload[i]);
        }
        break;
      case 'm':
        payload = JSON.parse(data.slice(1) || 'null');
        this.onEvent(payload);
        break;
      case 'c':
        payload = JSON.parse(data.slice(1) || '[]');
        this.onClose(payload[0], payload[1]);
        break;
      case 'h':
        this.onHeartbeatRequest('send');
        break;
    }
  };

  prototype.onOpen = function() {
    if (this.readyState === CONNECTING) {
      this.readyState = OPEN;
      if (this.onopen) {
        this.onopen();
      }
    } else {
      this.close(1006, "Server lost session");
    }
  };

  prototype.onEvent = function(event) {
    if (this.readyState === OPEN && this.onmessage) {
      this.onmessage({ data: event });
    }
  };

  prototype.onHeartbeatRequest = function() {
    if (this.readyState === OPEN) {
      this.send("[]");
    }
  };

  prototype.onError = function(error) {
    if (this.onerror) {
      this.onerror(error);
    }
  };

  prototype.onClose = function(code, reason) {
    this.cleanUp(false);
    if (this.onclose) {
      this.onclose(code, reason);
    }
  };

  prototype.advanceBuffer = function(buffer) {
    var unreadData = buffer.slice(this.bufferPosition);
    var endOfLinePosition = unreadData.indexOf("\n");

    if (endOfLinePosition !== -1) {
      this.bufferPosition += endOfLinePosition + 1;
      return unreadData.slice(0, endOfLinePosition);
    } else {
      // chunk is not finished yet, don't move the buffer pointer
      return null;
    }
  };

  function getBaseURL(url) {
    return url + "/" + randomNumber(1000) + "/" + randomString(8);
  }

  function getUniqueURL(url) {
    var separator = (url.indexOf('?') === -1) ? "?" : "&";
    return url + separator + "t=" + (+new Date);
  }

  function updateHostname(url, hostname) {
    var urlParts = /(https?:\/\/)([^\/:]+)((\/|:)?.*)/.exec(url);
    return urlParts[1] + hostname + urlParts[3];
  }

  function createXHR() {
    return new window.XMLHttpRequest();
  }

  function randomNumber(max) {
    return Math.floor(Math.random() * max);
  }

  function randomString(length) {
    var result = [];
    for (var i = 0; i < length; i++) {
      result.push(Math.floor(Math.random() * 32).toString(32));
    }
    return result.join('');
  };

  Pusher.HTTPStreamer = HTTPStreamer;
}).call(this);
