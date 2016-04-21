import Browser from "./browser";
import XHR from "./xhr";
import {Dependencies, DependenciesReceivers} from './dom/dependencies';
import {AuthTransport, AuthTransports} from 'core/auth/auth_transports';
import xhrAuth from 'isomorphic/auth/xhr_auth';
import jsonpAuth from './auth/jsonp_auth';
import TimelineTransport from 'core/timeline/timeline_transport';
import TimelineSender from 'core/timeline/timeline_sender';
import ScriptRequest from './dom/script_request';
import JSONPRequest from './dom/jsonp_request';
import * as Collections from 'core/utils/collections';
import {ScriptReceivers} from './dom/script_receiver_factory';
import jsonpTimeline from './timeline/jsonp_timeline';
import Transports from './transports/transports';
import Ajax from "core/http/ajax";
import {NetInfo, Network} from 'net_info';
import getDefaultStrategy from './default_strategy';

var Runtime : Browser = {

  // for jsonp auth
  nextAuthCallbackID: 1,
  auth_callbacks: {},
  ScriptReceivers,
  DependenciesReceivers,
  getDefaultStrategy,
  Transports,

  TimelineTransport: jsonpTimeline,
  WebSocket: window.WebSocket || window.MozWebSocket,

  whenReady(callback : Function) : void {
    var initializeOnDocumentBody = ()=> {
        this.onDocumentBody(callback);
    }
    if (!(<any>window).JSON) {
      Dependencies.load("json2", {}, initializeOnDocumentBody);
    } else {
      initializeOnDocumentBody();
    }
  },

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

  isXDRSupported(encrypted?: boolean) : boolean {
    var protocol = encrypted ? "https:" : "http:";
    var documentProtocol = this.getProtocol();
    return Boolean(<any>(window['XDomainRequest'])) && documentProtocol === protocol;
  },

  getGlobal() : any {
    return window;
  },

  getAuthorizers() : AuthTransports {
    return {ajax: xhrAuth, jsonp: jsonpAuth};
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
        { "ws": Transports.ws },
        function (t) { return t.isSupported({}); }
      )
    );
  },

  getLocalStorage() {
    try {
      return window.localStorage;
    } catch (e) {
      return undefined;
    }
  },

  createXHR() : Ajax {
    if (XHR.getAPI()){
      return this.createXMLHttpRequest();
    } else {
      return this.createMicrosoftXHR();
    }
  },

  createXMLHttpRequest() : Ajax {
    var Constructor = XHR.getAPI();
    return new Constructor();
  },

  createMicrosoftXHR() : Ajax {
    return new ActiveXObject("Microsoft.XMLHTTP");
  },

  getNetwork() : NetInfo {
    return Network;
  },

  createWebSocket(url : string) : any {
    var Constructor = this.WebSocket();
    return new Constructor(url);
  },
}

export default Runtime;
