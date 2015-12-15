var HTTPRequest = require('./http_request');
var XHR = require('pusher-websocket-js-iso-externals-node/xhr');

var hooks = {
  getRequest: function(socket) {
    var xhr = new XHR();
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

module.exports = getXHR = function(method, url) {
  return new HTTPRequest(hooks, method, url);
};
