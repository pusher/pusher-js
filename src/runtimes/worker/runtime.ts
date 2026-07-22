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
  HTTPFactory,
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
    // Rejection sampling avoids the bias introduced by scaling a fixed-range
    // random value down to `max` when `max` doesn't evenly divide 2**32.
    const crypto = globalThis.crypto || globalThis['msCrypto'];
    const limit = Math.floor(2 ** 32 / max) * max;
    let random;
    do {
      random = crypto.getRandomValues(new Uint32Array(1))[0];
    } while (random >= limit);

    return random % max;
  },
};

export default Worker;
