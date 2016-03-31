import HTTPRequest from "./http_request";
import Ajax from "./ajax";

interface RequestHooks {
  getRequest(HTTPRequest) : Ajax;
  abortRequest(HTTPRequest) : void;
}

export default RequestHooks;
