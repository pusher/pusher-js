import Isomorphic from 'isomorphic/runtime';
import Runtime from "../interface";
import {Network} from './net_info';
import fetchAuth from './auth/fetch_auth';
import {AuthTransports} from 'core/auth/auth_transports';
import fetchTimeline from './timeline/fetch_timeline';

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

const Worker : Runtime = {
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

  TimelineTransport: fetchTimeline,

  getAuthorizers() : AuthTransports {
    return {ajax: fetchAuth};
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

export default Worker;
