import Runtime from "./abstract_runtime";
import XHR from "pusher-websocket-iso-externals-xhr";
import {Dependencies} from './dom/dependencies';
import {AuthTransports, ajax, jsonp} from '../auth_transports';
import TimelineTransport from '../shared/timeline_transport';
import TimelineSender from '../timeline/timeline_sender';

var Browser : Runtime = {

  // for jsonp auth
  nextAuthCallbackID: 1;
  auth_callbacks: {},
  ScriptReceivers,
  DependenciesReceivers,

  whenReady(callback : Function) : void {
    var initializeOnDocumentBody = ()=> {
        this.onDocumentBody(callback);
    }
    if (!(<any>window).JSON) {
      Dependencies.load("json2", {}, initializeOnDocumentBody);
    } else {
      initializeOnDocumentBody();
    }
  }

  getDocument() : any {
    return document;
  },

  getProtocol() : string {
    return this.getDocument().location.protocol;
  },

  isXHRSupported() : boolean {
    var Constructor = XHR.getAPI();
    return Boolean(Constructor) && (new Constructor()).withCredentials !== undefined;
  },

  isSockJSSupported() : boolean {
    return true;
  },

  isXDRSupported(encrypted?: boolean) : boolean {
    var protocol = encrypted ? "https:" : "http:";
    var documentProtocol = this.getProtocol();
    return Boolean(<any>(window['XDomainRequest'])) && documentProtocol === protocol;
  },

  getGlobal() : any {
    return window;
  },

  getAuthorizers() : AuthTransports {
    return {ajax, jsonp};
  },

  getTimelineTransport(sender: TimelineSender, encrypted : boolean) : TimelineTransport {
    return jsonpTimeline(sender, encrypted);
  },

  onDocumentBody(callback : Function) {
    if (document.body) {
      callback();
    } else {
      setTimeout(()=> {
        this.onDocumentBody(callback);
      }, 0);
    }
  },

  createJSONPRequest(url : string, data : any) : JSONPRequest {
    return new JSONPRequest(url, data);
  },

  createScriptRequest(src : string) : ScriptRequest {
    return new ScriptRequest(src);
  },

  getClientFeatures() : any[] {
    return Collections.keys(
      Collections.filterObject(
        { "ws": Transports.WSTransport },
        function (t) { return t.isSupported({}); }
      )
    );
  }
}

export default Browser;
