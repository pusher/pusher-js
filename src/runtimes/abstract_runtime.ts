import * as Collections from '../utils/collections';
import Transports from "../transports/transports";
import {AuthTransports, ajax as ajaxAuth} from '../auth_transports';
import {TimelineTransport, xhr as xhrTimeline} from '../timeline/timeline_transports';
import TimelineSender from '../timeline/timeline_sender';
import {ScriptReceivers} from './dom/script_receiver_factory';
import {DependenciesReceivers} from './dom/dependencies';

abstract class Runtime {
  abstract whenReady(callback : Function) : void;
  abstract getProtocol() : string;
  abstract isXHRSupported() : boolean;
  abstract isXDRSupported(encrypted?: boolean) : boolean;
  abstract isSockJSSupported() : boolean;
  abstract getDocument() : any;
  abstract getGlobal() : any;

  // for jsonp auth
  nextAuthCallbackID: number = 1;
  auth_callbacks: any = {};
  ScriptReceivers : any = ScriptReceivers;
  DependenciesReceivers  : any = DependenciesReceivers;

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
        { "ws": Transports.WSTransport },
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
