import AbstractRuntime from '../../runtimes/interface';
import { InternalAuthOptions } from './options';
interface AuthTransport {
    (context: AbstractRuntime, query: string, options: InternalAuthOptions, callback: Function): void;
}
interface AuthTransports {
    [index: string]: AuthTransport;
}
export { AuthTransport, AuthTransports };
