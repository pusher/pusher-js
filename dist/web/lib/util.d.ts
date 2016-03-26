import TimedCallback from "./utils/timers/timed_callback";
import { OneOffTimer } from "./utils/timers";
export declare function now(): number;
export declare function defer(callback: TimedCallback): OneOffTimer;
/** Builds a function that will proxy a method call to its first argument.
*
* Allows partial application of arguments, so additional arguments are
* prepended to the argument list.
*
* @param  {String} name method name
* @return {Function} proxy function
*/
export declare function method(name: string, ...args: any[]): Function;
export declare function getLocalStorage(): any;
export declare function getClientFeatures(): any[];
export declare function isXHRSupported(): boolean;
export declare function isXDRSupported(encrypted: boolean): boolean;
export declare function getDocument(): any;
export declare function getProtocol(): string;
