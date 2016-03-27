import Runtime from "./abstract_runtime";

export default class Isomorphic extends Runtime {

  whenReady(callback : Function) : void {
    callback();
  }

  getProtocol() : string {
    return "http:";
  }

  isXHRSupported() : boolean {
    return true;
  }

  isXDRSupported(encrypted?: boolean) : boolean {
    return false;
  }

  isSockJSSupported() : boolean {
    return false;
  }

  getGlobal() : any {
    return Function("return this")();
  }

  getDocument() : any {
    throw("Isomorphic runtime detected, but document not available. Please raise an issue on pusher/pusher-websocket-js-iso");
  }
}
