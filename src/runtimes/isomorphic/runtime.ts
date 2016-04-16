import Runtime from "../interface";
import xhrTimeline from './timeline/xhr_timeline';
import TimelineTransport from 'core/timeline/timeline_transport';
import xhrAuth from 'isomorphic/auth/xhr_auth';
import * as Collections from 'core/utils/collections';
import Transports from "isomorphic/transports/transports";
import {AuthTransports} from 'core/auth/auth_transports';
import TimelineSender from 'core/timeline/timeline_sender';
import Ajax from 'core/http/ajax';
import XHR from 'xhr';
import WS from 'ws';
import {NetInfo, Network} from 'net_info';
import getDefaultStrategy from './default_strategy';

var Isomorphic : Runtime = {

  TimelineTransport: xhrTimeline,
  getDefaultStrategy,
  Transports,

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

  getGlobal() : any {
    return Function("return this")();
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
  },

  createXHR() : Ajax {
    var Constructor = XHR.getAPI();
    return new Constructor();
  },

  getNetwork() : NetInfo {
    return Network;
  },

  createWebSocket(url : string) : any {
    var Constructor = WS.getAPI();
    return new Constructor(url);
  },
}

export default Isomorphic;
