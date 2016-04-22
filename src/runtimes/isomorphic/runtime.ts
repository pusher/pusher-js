import xhrTimeline from './timeline/xhr_timeline';
import TimelineTransport from 'core/timeline/timeline_transport';
import xhrAuth from 'isomorphic/auth/xhr_auth';
import * as Collections from 'core/utils/collections';
import Transports from "isomorphic/transports/transports";
import {AuthTransports} from 'core/auth/auth_transports';
import TimelineSender from 'core/timeline/timeline_sender';
import Ajax from 'core/http/ajax';
import {NetInfo, Network} from 'net_info';
import getDefaultStrategy from './default_strategy';
import TransportsTable from "core/transports/transports_table";

var Isomorphic : any = {

  TimelineTransport: xhrTimeline,
  getDefaultStrategy,
  Transports: <TransportsTable> Transports,

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
    var Constructor = this.getXHRAPI();
    return new Constructor();
  },

  getNetwork() : NetInfo {
    return Network;
  },

  createWebSocket(url : string) : any {
    var Constructor = this.getWebSocketAPI();
    return new Constructor(url);
  }
}

export default Isomorphic;
