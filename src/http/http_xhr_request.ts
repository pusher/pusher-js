import HTTPRequest from './http_request';
import XHR from 'pusher-websocket-iso-externals-node/xhr';
import RequestHooks from "./request_hooks";
import Ajax from "./ajax";

var hooks : RequestHooks = {
  getRequest: function(socket : HTTPRequest) : Ajax {
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
  abortRequest: function(xhr : Ajax) {
    xhr.onreadystatechange = null;
    xhr.abort();
  }
};

var getXHR = function(method : string, url : string) : HTTPRequest {
  return new HTTPRequest(hooks, method, url);
};

export default getXHR;
