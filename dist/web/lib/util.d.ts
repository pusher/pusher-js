import TimedCallback from "./utils/timers/timed_callback";
import { OneOffTimer } from "./utils/timers";
declare var Util: {
    now(): number;
    defer(callback: TimedCallback): OneOffTimer;
    method(name: string, ...args: any[]): Function;
    getLocalStorage(): any;
    getClientFeatures(): any[];
    isXHRSupported(): boolean;
    isXDRSupported(encrypted?: boolean): boolean;
    getDocument(): any;
    getProtocol(): string;
};
export default Util;
