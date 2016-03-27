import Runtime from "./abstract_runtime";
import XHR from "pusher-websocket-iso-externals-node/xhr";
import {Dependencies} from './dom/dependencies';
import {AuthTransports, ajax, jsonp} from '../auth_transports';
import {TimelineTransport, jsonp as jsonpTimeline} from '../timeline/timeline_transports';
import TimelineSender from '../timeline/timeline_sender';

export default class Browser extends Runtime {

  // for jsonp auth
  nextAuthCallbackID: number = 1;
  auth_callbacks: any = {};

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
  }

  getProtocol() : string {
    return this.getDocument().location.protocol;
  }

  isXHRSupported() : boolean {
    var Constructor = XHR.getAPI();
    return Boolean(Constructor) && (new Constructor()).withCredentials !== undefined;
  }

  isSockJSSupported() : boolean {
    return true;
  }

  isXDRSupported(encrypted?: boolean) : boolean {
    var protocol = encrypted ? "https:" : "http:";
    var documentProtocol = this.getProtocol();
    return Boolean(<any>(window['XDomainRequest'])) && documentProtocol === protocol;
  }

  getGlobal() : any {
    return window;
  }

  getAuthorizers() : AuthTransports {
    return {ajax, jsonp};
  }

  getTimelineTransport(sender: TimelineSender, encrypted : boolean) : TimelineTransport {
    return jsonpTimeline(sender, encrypted);
  }

  private onDocumentBody(callback : Function) {
    if (document.body) {
      callback();
    } else {
      setTimeout(()=> {
        this.onDocumentBody(callback);
      }, 0);
    }
  }
}
