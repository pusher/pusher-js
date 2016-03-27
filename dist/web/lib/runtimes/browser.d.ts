import Runtime from "./abstract_runtime";
export default class Browser extends Runtime {
    whenReady(callback: Function): void;
    getDocument(): any;
    getProtocol(): string;
    isXHRSupported(): boolean;
    isXDRSupported(encrypted?: boolean): boolean;
}
