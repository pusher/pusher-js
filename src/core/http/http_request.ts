import Runtime from 'runtime';
import RequestHooks from './request_hooks';
import Ajax from './ajax';
import { default as EventsDispatcher } from '../events/dispatcher';

const MAX_BUFFER_LENGTH = 256 * 1024;

export default class HTTPRequest extends EventsDispatcher {
  hooks: RequestHooks;
  method: string;
  url: string;
  position: number;
  xhr: Ajax;
  unloader: Function;

  constructor(hooks: RequestHooks, method: string, url: string) {
    super();
    this.hooks = hooks;
    this.method = method;
    this.url = url;
  }

  start(payload?: any) {
    this.position = 0;
    this.xhr = this.hooks.getRequest(this);

    this.unloader = () => {
      this.close();
    };
    Runtime.addUnloadListener(this.unloader);

    this.xhr.open(this.method, this.url, true);

    if (this.xhr.setRequestHeader) {
      this.xhr.setRequestHeader('Content-Type', 'application/json'); // ReactNative doesn't set this header by default.
    }
    this.xhr.send(payload);
  }

  close() {
    if (this.unloader) {
      Runtime.removeUnloadListener(this.unloader);
      this.unloader = null;
    }
    if (this.xhr) {
      this.hooks.abortRequest(this.xhr);
      this.xhr = null;
    }
  }

  onChunk(status: number, data: any) {
    while (true) {
      var chunk = this.advanceBuffer(data);
      if (chunk) {
        this.emit('chunk', { status: status, data: chunk });
      } else {
        break;
      }
    }
    if (this.isBufferTooLong(data)) {
      this.emit('buffer_too_long');
    }
  }

  private advanceBuffer(buffer: any[]): any {
    var unreadData = buffer.slice(this.position);
    var endOfLinePosition = unreadData.indexOf('\n');

    if (endOfLinePosition !== -1) {
      this.position += endOfLinePosition + 1;
      return unreadData.slice(0, endOfLinePosition);
    } else {
      // chunk is not finished yet, don't move the buffer pointer
      return null;
    }
  }

  private isBufferTooLong(buffer: any): boolean {
    return this.position === buffer.length && buffer.length > MAX_BUFFER_LENGTH;
  }
}
