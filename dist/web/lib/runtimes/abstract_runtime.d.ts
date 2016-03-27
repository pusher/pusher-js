import { AuthTransports } from '../auth_transports';
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
}
export default Runtime;
