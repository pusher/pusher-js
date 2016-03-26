import * as Collections from "./utils/collections";
import TimedCallback from "./utils/timers/timed_callback";
import {OneOffTimer, PeriodicTimer} from "./utils/timers";
import {WSTransport} from "./transports/transports";
import XHR from "pusher-websocket-iso-externals-node/xhr";

var global = Function("return this")();
declare var ActiveXObject: (type: string) => void;

export function now() : number {
  if (Date.now) {
    return Date.now();
  } else {
    return new Date().valueOf();
  }
}

export function defer(callback : TimedCallback) : OneOffTimer {
  return new OneOffTimer(0, callback);
}

/** Builds a function that will proxy a method call to its first argument.
*
* Allows partial application of arguments, so additional arguments are
* prepended to the argument list.
*
* @param  {String} name method name
* @return {Function} proxy function
*/
export function method(name : string, ...args : any[]) : Function {
  var boundArguments = Array.prototype.slice.call(arguments, 1);
  return function(object) {
    return object[name].apply(object, boundArguments.concat(arguments));
  };
}

export function getLocalStorage() : Object {
  try {
    return window.localStorage;
  } catch (e) {
    return undefined;
  }
}

export function getClientFeatures() : Object[] {
  return Collections.keys(
    Collections.filterObject(
      { "ws": WSTransport },
      function (t) { return t.isSupported({}); }
    )
  );
}

export function isXHRSupported() : boolean {
  return Boolean(XHR) && (new XHR()).withCredentials !== undefined;
}

export function isXDRSupported(encrypted : boolean) : boolean {
  var protocol = encrypted ? "https:" : "http:";
  var documentProtocol = getProtocol();
  return Boolean('XDomainRequest' in window) && documentProtocol === protocol;
}

export function getDocument() : any {
  try {
    return document || undefined;
  } catch(e) {
    return undefined;
  }
}

export function getProtocol() : string {
  if (getDocument() !== undefined){
    return getDocument().location.protocol;
  }
  return "http:";
}
