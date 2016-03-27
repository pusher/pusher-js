import Runtime from "./abstract_runtime";
import XHR from "pusher-websocket-iso-externals-node/xhr";

export default class Browser extends Runtime {

  // TODO: REPLACE WITH DEPENDENCY LOADER
  whenReady(callback : Function) : void {
    callback();
  }

  getDocument() : any {
    return document;
  }

  getProtocol() : string {
    return this.getDocument().location.protocol;
  }

  isXHRSupported() : boolean {
    var Constructor = XHR.getAPI();
    return Boolean(Constructor) && (new Constructor()).withCredentials !== undefined;
  }

  isXDRSupported(encrypted?: boolean) : boolean {
    var protocol = encrypted ? "https:" : "http:";
    var documentProtocol = this.getProtocol();
    return Boolean(<any>(window['XDomainRequest'])) && documentProtocol === protocol;
  }
}
