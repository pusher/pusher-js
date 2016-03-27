import * as Collections from '../utils/collections';
import {WSTransport} from '../transports/transports';

abstract class Runtime {
  abstract whenReady(callback : Function) : void;
  abstract getProtocol() : string;
  abstract isXHRSupported() : boolean;
  abstract isXDRSupported(encrypted?: boolean) : boolean;
  abstract getDocument() : any;

  getLocalStorage() : any {
    try {
      return window.localStorage;
    } catch (e) {
      return undefined;
    }
  }

  getClientFeatures() : any[] {
    return Collections.keys(
      Collections.filterObject(
        { "ws": WSTransport },
        function (t) { return t.isSupported({}); }
      )
    );
  }
}

export default Runtime;
