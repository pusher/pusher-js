import Runtime from "shared/runtime_interface";
import xhrTimeline from './timeline/xhr_timeline';
import TimelineTransport from 'shared/timeline/timeline_transport';
import xhrAuth from 'shared/auth/xhr_auth';
import * as Collections from 'core/utils/collections';
import Transports from "transports/transports";
import {AuthTransports} from 'shared/auth/auth_transports';
import TimelineSender from 'core/timeline/timeline_sender';

var Isomorphic : Runtime = {

  TimelineTransport: xhrTimeline,

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

  getLocalStorage() : any {
    return undefined;
  },

  getClientFeatures() : any[] {
    return Collections.keys(
      Collections.filterObject(
        { "ws": Transports.ws },
        function (t) { return t.isSupported({}); }
      )
    );
  }
}

export default Isomorphic;
