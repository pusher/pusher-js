import * as Collections from "./utils/collections";
import TimedCallback from "./utils/timers/timed_callback";
import {OneOffTimer, PeriodicTimer} from "./utils/timers";

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
  }
}

export default Util;
