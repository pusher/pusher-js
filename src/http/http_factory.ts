import HTTPRequest from "./http_request";
import HTTPSocket from "./http_socket";
import SocketHooks from "./socket_hooks";
import RequestHooks from "./request_hooks";
import streamingHooks from './http_streaming_socket';
import pollingHooks from './http_polling_socket';
import xhrHooks from './http_xhr_request';
import xdrHooks from './http_xdomain_request';

export default class HTTPFactory {

  createStreamingSocket(url : string) : HTTPSocket {
    return this.createSocket(streamingHooks, url);
  }

  createPollingSocket(url : string) : HTTPSocket {
    return this.createSocket(pollingHooks, url);
  }

  createSocket(hooks : SocketHooks, url : string) : HTTPSocket {
    return new HTTPSocket(this, hooks, url);
  }

  createXHR(method : string, url : string) : HTTPRequest {
    return this.createRequest(xhrHooks, method, url);
  }

  createXDR(method : string, url : string) : HTTPRequest {
    return this.createRequest(xdrHooks, method, url);
  }

  createRequest(hooks : RequestHooks, method : string, url : string) : HTTPRequest {
    return new HTTPRequest(hooks, method, url);
  }
}
