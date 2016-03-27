import Runtime from "./abstract_runtime";
import { AuthTransports } from '../auth_transports';
import { TimelineTransport } from '../timeline/timeline_transports';
import TimelineSender from '../timeline/timeline_sender';
export default class Browser extends Runtime {
    whenReady(callback: Function): void;
    getDocument(): any;
    getProtocol(): string;
    isXHRSupported(): boolean;
    isSockJSSupported(): boolean;
    isXDRSupported(encrypted?: boolean): boolean;
    getGlobal(): any;
    getAuthorizers(): AuthTransports;
    getTimelineTransport(sender: TimelineSender, encrypted: boolean): TimelineTransport;
    private onDocumentBody(callback);
}
