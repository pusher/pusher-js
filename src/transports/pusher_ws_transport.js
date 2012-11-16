;(function() {

  function PusherWSTransport(key, options) {
    Pusher.EventsDispatcher.call(this);

    this.key = key;
    this.options = options;
  };
  var prototype = PusherWSTransport.prototype;

  Pusher.Util.extend(prototype, Pusher.EventsDispatcher.prototype);

  // interface

  PusherWSTransport.isSupported = function() {
    return window.WebSocket != undefined || window.MozWebSocket != undefined;
  }

  prototype.name = "ws";

  prototype.connect = function() {
    if (this.socket) {
      return false;
    }

    var self = this;
    var url = getURL(this.key, this.options);

    this.socket = new WebSocket(url);
    this.socket.onopen = function() {
      changeState(self, "open");
      self.socket.onopen = undefined;
    };
    this.socket.onerror = function(error) {
      self.emit("error", { type: 'WebSocketError', error: error });
    }
    this.socket.onclose = function() {
      changeState(self, "closed");
      self.socket = undefined;
    }
    this.socket.onmessage = function(message) {
      self.emit("message", message);
    }

    changeState(this, "connecting");
    return true;
  };

  prototype.close = function() {
    this.socket.close();
  };

  prototype.send = function(data) {
    if (this.state === "open") {
      // Workaround for MobileSafari bug (see https://gist.github.com/2052006)
      var self = this;
      setTimeout(function() {
        self.socket.send(data);
      }, 0);
      return true;
    } else {
      return false;
    }
  };

  prototype.supportsPing = function() {
    // We have no way to know whether we're using a browser that supports ping
    return false;
  }

  // helpers

  function getURL(key, options) {
    var port = options.secure ? options.securePort : options.nonsecurePort;
    var scheme = options.secure ? "wss" : "ws";

    var flash = (Pusher.TransportType === "flash") ? "true" : "false";
    var path = '/app/' + key + '?protocol=5&client=js&flash=false'
      + '&version=' + Pusher.VERSION

    return scheme + "://" + options.host + ':' + port + path;
  }

  function changeState(o, state, params) {
    o.state = state;
    o.emit(state, params);
  }

  this.PusherWSTransport = PusherWSTransport;
}).call(this);
