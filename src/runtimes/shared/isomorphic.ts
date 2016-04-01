import Runtime from "./runtime_interface";
import xhrTimeline from './xhr_timeline';
import TimelineTransport from './timeline_transport';
import xhrAuth from './xhr_auth';
import * as Collections from '../../utils/collections';
import Transports from "./transports";
import {AuthTransports} from './auth_transports';
import TimelineSender from '../../timeline/timeline_sender';

var Isomorphic : Runtime = {

  whenReady(callback : Function) : void {
    callback();
  },

  getProtocol() : string {
    return "http:";
  },

  isXHRSupported() : boolean {
    return true;
  },

  isXDRSupported(encrypted?: boolean) : boolean {
    return false;
  },

  isSockJSSupported() : boolean {
    return false;
  },

  getGlobal() : any {
    return Function("return this")();
  },

  getDocument() : any {
    throw("Isomorphic runtime detected, but getDocument alled. Please raise an issue on pusher/pusher-websocket-js-iso");
  },

  getAuthorizers() : AuthTransports {
    return {ajax: xhrAuth};
  },

  getTimelineTransport(sender: TimelineSender, encrypted : boolean) : TimelineTransport {
    return xhrTimeline(sender, encrypted);
  },

  getLocalStorage() : any {
    return undefined;
  },

  getClientFeatures() : any[] {
    return Collections.keys(
      Collections.filterObject(
        { "ws": Transports.WSTransport },
        function (t) { return t.isSupported({}); }
      )
    );
  }
}

export default Isomorphic;
