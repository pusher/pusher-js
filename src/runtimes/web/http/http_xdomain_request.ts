import HTTPRequest from 'core/http/http_request';
import RequestHooks from 'core/http/request_hooks';
import Ajax from 'core/http/ajax';
import * as Errors from 'core/errors';

var hooks: RequestHooks = {
  getRequest: function(socket: HTTPRequest): Ajax {
    var xdr = new (<any>window).XDomainRequest();
    xdr.ontimeout = function() {
      socket.emit('error', new Errors.RequestTimedOut());
      socket.close();
    };
    xdr.onerror = function(e) {
      socket.emit('error', e);
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
      socket.emit('finished', 200);
      socket.close();
    };
    return xdr;
  },
  abortRequest: function(xdr: Ajax) {
    xdr.ontimeout = xdr.onerror = xdr.onprogress = xdr.onload = null;
    xdr.abort();
  }
};

export default hooks;
