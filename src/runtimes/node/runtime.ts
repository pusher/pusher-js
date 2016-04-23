import Isomorphic from 'isomorphic/runtime';
import {Client as WebSocket} from "faye-websocket";
import {XMLHttpRequest} from "xmlhttprequest";
import Runtime from "../interface";
import {Network} from './net_info';
import xhrAuth from 'isomorphic/auth/xhr_auth';
import {AuthTransports} from 'core/auth/auth_transports';
import xhrTimeline from 'isomorphic/timeline/xhr_timeline';

// Very verbose but until unavoidable until
// TypeScript 2.1, when spread attributes will be
// supported
const {
  getDefaultStrategy,
  Transports,
  whenReady,
  getProtocol,
  isXHRSupported,
  isXDRSupported,
  getGlobal,
  getLocalStorage,
  getClientFeatures,
  createXHR,
  createWebSocket,
  addUnloadListener,
  removeUnloadListener,
  transportConnectionInitializer
} = Isomorphic;

const NodeJS : Runtime = {
  getDefaultStrategy,
  Transports,
  whenReady,
  getProtocol,
  isXHRSupported,
  isXDRSupported,
  getGlobal,
  getLocalStorage,
  getClientFeatures,
  createXHR,
  createWebSocket,
  addUnloadListener,
  removeUnloadListener,
  transportConnectionInitializer,

  TimelineTransport: xhrTimeline,

  getAuthorizers() : AuthTransports {
    return {ajax: xhrAuth};
  },

  getWebSocketAPI() {
    return WebSocket;
  },

  getXHRAPI() {
    return XMLHttpRequest;
  },

  getNetwork() {
    return Network;
  }
};

export default NodeJS;
