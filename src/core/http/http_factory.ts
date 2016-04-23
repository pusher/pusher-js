import HTTPSocket from "./http_socket";
import SocketHooks from "./socket_hooks";
import HTTPRequest from "./http_request";
import RequestHooks from "./request_hooks";
import Ajax from './ajax';

interface HTTPFactory {
  createStreamingSocket(url : string) : HTTPSocket;
  createPollingSocket(url : string) : HTTPSocket;
  createSocket(hooks : SocketHooks, url : string) : HTTPSocket;
  createXHR(method : string, url : string) : HTTPRequest;
  createXDR?(method : string, url : string) : HTTPRequest;
  createRequest(hooks : RequestHooks, method : string, url : string) : HTTPRequest;
}

export default HTTPFactory;
