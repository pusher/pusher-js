import Isomorphic from 'isomorphic/runtime';
import Runtime from "../interface";

// Very verbose but until unavoidable until
// TypeScript 2.1, when spread attributes will be
// supported
const {
  TimelineTransport,
  getDefaultStrategy,
  Transports,
  whenReady,
  getProtocol,
  isXHRSupported,
  isXDRSupported,
  getGlobal,
  getAuthorizers,
  getLocalStorage,
  getClientFeatures,
  createXHR,
  getNetwork,
  createWebSocket,
  addUnloadListener,
  removeUnloadListener
} = Isomorphic;

const Worker : Runtime = {
  TimelineTransport,
  getDefaultStrategy,
  Transports,
  whenReady,
  getProtocol,
  isXHRSupported,
  isXDRSupported,
  getGlobal,
  getAuthorizers,
  getLocalStorage,
  getClientFeatures,
  createXHR,
  getNetwork,
  createWebSocket,
  addUnloadListener,
  removeUnloadListener,

  getWebSocketAPI() {
    return WebSocket;
  },

  getXHRAPI() {
    return XMLHttpRequest;
  }
};

export default Worker;
