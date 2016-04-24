import Runtime from "./abstract_runtime";
export default class Isomorphic extends Runtime {
    whenReady(callback: Function): void;
    getProtocol(): string;
    isXHRSupported(): boolean;
    isXDRSupported(encrypted?: boolean): boolean;
    isSockJSSupported(): boolean;
    getGlobal(): any;
    getDocument(): any;
}
