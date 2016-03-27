import * as Collections from "./utils/collections";
import TimedCallback from "./utils/timers/timed_callback";
import {OneOffTimer, PeriodicTimer} from "./utils/timers";
import {WSTransport} from "./transports/transports";
import XHR from "pusher-websocket-iso-externals-node/xhr";

var global = Function("return this")();
declare var ActiveXObject: (type: string) => void;

var Util = {
  now() : number {
    if (Date.now) {
      return Date.now();
    } else {
      return new Date().valueOf();
    }
  },

  defer(callback : TimedCallback) : OneOffTimer {
    return new OneOffTimer(0, callback);
  },

  /** Builds a function that will proxy a method call to its first argument.
  *
  * Allows partial application of arguments, so additional arguments are
  * prepended to the argument list.
  *
  * @param  {String} name method name
  * @return {Function} proxy function
  */
  method(name : string, ...args : any[]) : Function {
    var boundArguments = Array.prototype.slice.call(arguments, 1);
    return function(object) {
      return object[name].apply(object, boundArguments.concat(arguments));
    };
  },

  getLocalStorage() : any {
    try {
      return window.localStorage;
    } catch (e) {
      return undefined;
    }
  },

  getClientFeatures() : any[] {
    return Collections.keys(
      Collections.filterObject(
        { "ws": WSTransport },
        function (t) { return t.isSupported({}); }
      )
    );
  },

  isXHRSupported() : boolean {
    var Constructor = XHR.getAPI();
    return Boolean(Constructor) && (new Constructor()).withCredentials !== undefined;
  },

  isXDRSupported(encrypted?: boolean) : boolean {
    var protocol = encrypted ? "https:" : "http:";
    var documentProtocol = this.getProtocol();
    return Boolean(<any>(window['XDomainRequest'])) && documentProtocol === protocol;
  },

  getDocument() : any {
    try {
      return document || undefined;
    } catch(e) {
      return undefined;
    }
  },

  getProtocol() : string {
    if (this.getDocument() !== undefined){
      return this.getDocument().location.protocol;
    }
    return "http:";
  }
}

export default Util;
