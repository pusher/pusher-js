import Ajax from "../http/ajax";
import XHR from "pusher-websocket-iso-externals-node/xhr";

export default class Factory {

  createXHR() : Ajax {
    if (XHR){
      return this.createXMLHttpRequest();
    } else {
      return this.createMicrosoftXHR();
    }
  }

  createXMLHttpRequest() : Ajax {
    return new XHR();
  }

  createMicrosoftXHR() : Ajax {
    return new ActiveXObject("Microsoft.XMLHTTP");
  }
}
