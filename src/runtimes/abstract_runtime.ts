import * as Collections from '../utils/collections';
import {WSTransport} from '../transports/transports';
import {AuthTransports, ajax as ajaxAuth} from '../auth_transports';
import {TimelineTransport, xhr as xhrTimeline} from '../timeline/timeline_transports';
import TimelineSender from '../timeline/timeline_sender';

abstract class Runtime {
  abstract whenReady(callback : Function) : void;
  abstract getProtocol() : string;
  abstract isXHRSupported() : boolean;
  abstract isXDRSupported(encrypted?: boolean) : boolean;
  abstract isSockJSSupported() : boolean;
  abstract getDocument() : any;
  abstract getGlobal() : any;

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

  getAuthorizers() : AuthTransports {
    return {ajaxAuth};
  }

  getTimelineTransport(sender : TimelineSender, encrypted : boolean) : TimelineTransport {
    return xhrTimeline(sender, encrypted);
  }
}

export default Runtime;
