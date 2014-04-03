;(function() {
  var hooks = {
    getRequest: function(socket) {
      var xdr = new window.XDomainRequest();
      xdr.ontimeout = function() {
        socket.emit("error", new Pusher.Errors.RequestTimedOut());
        socket.close();
      };
      xdr.onerror = function(e) {
        socket.emit("error", e);
        socket.close();
      };
      xdr.onprogress = function() {
        if (xdr.responseText && xdr.responseText.length > 0) {
          socket.onChunk(200, xdr.responseText);
        }
      };
      xdr.onload = function() {
        if (xdr.responseText && xdr.responseText.length > 0) {
          socket.onChunk(200, xdr.responseText);
        }
        socket.emit("finished", 200);
        socket.close();
      };
      return xdr;
    },
    abortRequest: function(xdr) {
      xdr.ontimeout = xdr.onerror = xdr.onprogress = xdr.onload = null;
      xdr.abort();
    }
  };

  Pusher.HTTP.getXDR = function(method, url) {
    return new Pusher.HTTP.Request(hooks, method, url);
  };
}).call(this);
