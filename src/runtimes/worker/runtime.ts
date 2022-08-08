import Isomorphic from 'isomorphic/runtime';
import Runtime from '../interface';
import { Network } from './net_info';
import fetchAuth from './auth/fetch_auth';
import { AuthTransports } from 'core/auth/auth_transports';
import fetchTimeline from './timeline/fetch_timeline';

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

const Worker: Runtime = {
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
  HTTPFactory,

  TimelineTransport: fetchTimeline,

  getAuthorizers(): AuthTransports {
    return { ajax: fetchAuth };
  },

  getWebSocketAPI() {
    return WebSocket;
  },

  getXHRAPI() {
    return XMLHttpRequest;
  },

  getNetwork() {
    return Network;
  },

  randomInt(max: number): number {
    /**
     * Return values in the range of [0, 1[
     */
    const random = function() {
      const crypto = window.crypto || window['msCrypto'];
      const random = crypto.getRandomValues(new Uint32Array(1))[0];

      return random / 2 ** 32;
    };

    return Math.floor(random() * max);
  }
};

export default Worker;
