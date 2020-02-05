import RequestHooks from './request_hooks';
import Ajax from './ajax';
import { default as EventsDispatcher } from '../events/dispatcher';
export default class HTTPRequest extends EventsDispatcher {
    hooks: RequestHooks;
    method: string;
    url: string;
    position: number;
    xhr: Ajax;
    unloader: Function;
    constructor(hooks: RequestHooks, method: string, url: string);
    start(payload?: any): void;
    close(): void;
    onChunk(status: number, data: any): void;
    private advanceBuffer;
    private isBufferTooLong;
}
