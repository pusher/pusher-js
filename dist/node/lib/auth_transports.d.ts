import AbstractRuntime from './runtimes/abstract_runtime';
interface AuthTransport {
    (context: AbstractRuntime, socketId: string, callback: Function): void;
}
interface AuthTransports {
    [index: string]: AuthTransport;
}
declare var ajax: AuthTransport;
declare var jsonp: AuthTransport;
export { AuthTransport, AuthTransports, ajax, jsonp };