import Runtime from "./abstract_runtime";
export default class Browser extends Runtime {
    nextAuthCallbackID: number;
    whenReady(callback: Function): void;
    getDocument(): any;
    getProtocol(): string;
    isXHRSupported(): boolean;
    isSockJSSupported(): boolean;
    isXDRSupported(encrypted?: boolean): boolean;
    getGlobal(): any;
    private onDocumentBody(callback);
}
