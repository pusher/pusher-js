import * as Collections from 'core/utils/collections';
import Transports from "isomorphic/transports/transports";
import TimelineSender from 'core/timeline/timeline_sender';
import Ajax from 'core/http/ajax';
import getDefaultStrategy from './default_strategy';
import TransportsTable from "core/transports/transports_table";
import transportConnectionInitializer from './transports/transport_connection_initializer';

var Isomorphic : any = {
  getDefaultStrategy,
  Transports: <TransportsTable> Transports,
  transportConnectionInitializer,

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

  createWebSocket(url : string) : any {
    var Constructor = this.getWebSocketAPI();
    return new Constructor(url);
  },

  addUnloadListener(listener : any) {},
  removeUnloadListener(listener : any) {}
}

export default Isomorphic;
