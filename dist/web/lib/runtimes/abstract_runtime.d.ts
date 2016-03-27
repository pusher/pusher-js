import { AuthTransports } from '../auth_transports';
import { TimelineTransport } from '../timeline/timeline_transports';
import TimelineSender from '../timeline/timeline_sender';
declare abstract class Runtime {
    abstract whenReady(callback: Function): void;
    abstract getProtocol(): string;
    abstract isXHRSupported(): boolean;
    abstract isXDRSupported(encrypted?: boolean): boolean;
    abstract isSockJSSupported(): boolean;
    abstract getDocument(): any;
    abstract getGlobal(): any;
    getLocalStorage(): any;
    getClientFeatures(): any[];
    getAuthorizers(): AuthTransports;
    getTimelineTransport(sender: TimelineSender, encrypted: boolean): TimelineTransport;
}
export default Runtime;
