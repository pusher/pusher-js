;(function() {
  var hooks = {
    getRequest: function(socket) {
      var xhr = new window.XMLHttpRequest();
      xhr.onreadystatechange = xhr.onprogress = function() {
        switch (xhr.readyState) {
          case 3:
            if (xhr.responseText && xhr.responseText.length > 0) {
              socket.onChunk(xhr.status, xhr.responseText);
            }
            break;
          case 4:
            // this happens only on errors, never after calling close
            if (xhr.responseText && xhr.responseText.length > 0) {
              socket.onChunk(xhr.status, xhr.responseText);
            }
            socket.emit("finished", xhr.status);
            socket.close();
            break;
        }
      };
      return xhr;
    },
    abortRequest: function(xhr) {
      xhr.onreadystatechange = null;
      xhr.abort();
    }
  };

  Pusher.HTTP.getXHR = function(method, url) {
    return new Pusher.HTTP.Request(hooks, method, url);
  };
}).call(this);
