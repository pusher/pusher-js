import Isomorphic from 'isomorphic/runtime';
import WebSocket = require( "ws" );
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
  setup,
  getProtocol,
  isXHRSupported,
  getLocalStorage,
  createXHR,
  createWebSocket,
  addUnloadListener,
  removeUnloadListener,
  transportConnectionInitializer,
  createSocketRequest,
  HTTPFactory
} = Isomorphic;

const NodeJS : Runtime = {
  getDefaultStrategy,
  Transports,
  setup,
  getProtocol,
  isXHRSupported,
  createSocketRequest,
  getLocalStorage,
  createXHR,
  createWebSocket,
  addUnloadListener,
  removeUnloadListener,
  transportConnectionInitializer,
  HTTPFactory,

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
