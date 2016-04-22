import Isomorphic from 'isomorphic/runtime';
import {Client as WebSocket} from "faye-websocket";
import {XMLHttpRequest} from "xmlhttprequest";
import Runtime from "../interface";
import {Network} from './net_info';

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
  createWebSocket,
  addUnloadListener,
  removeUnloadListener,
  transportConnectionInitializer
} = Isomorphic;

const NodeJS : Runtime = {
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
  createWebSocket,
  addUnloadListener,
  removeUnloadListener,
  transportConnectionInitializer,

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
