import { Options } from './options';
import Defaults from './defaults';
import { AuthOptions, AuthorizerGenerator } from './auth/options';
import Runtime from 'runtime';
import * as nacl from 'tweetnacl';
import Logger from './logger';

export type AuthTransport = 'ajax' | 'jsonp';
export type Transport =
  | 'ws'
  | 'wss'
  | 'xhr_streaming'
  | 'xhr_polling'
  | 'sockjs';

export interface Config {
  // these are all 'required' config parameters, it's not necessary for the user
  // to set them, but they have configured defaults.
  activityTimeout: number;
  authEndpoint: string;
  authTransport: AuthTransport;
  enableStats: boolean;
  httpHost: string;
  httpPath: string;
  httpPort: number;
  httpsPort: number;
  pongTimeout: number;
  statsHost: string;
  unavailableTimeout: number;
  useTLS: boolean;
  wsHost: string;
  wsPath: string;
  wsPort: number;
  wssPort: number;

  // these are all optional parameters or overrrides. The customer can set these
  // but it's not strictly necessary
  forceTLS?: boolean;
  auth?: AuthOptions;
  authorizer?: AuthorizerGenerator;
  cluster?: string;
  disabledTransports?: Transport[];
  enabledTransports?: Transport[];
  ignoreNullOrigin?: boolean;
  nacl?: nacl;
  timelineParams?: any;
}

export function getConfig(opts: Options): Config {
  let config: Config = {
    activityTimeout: opts.activityTimeout || Defaults.activityTimeout,
    authEndpoint: opts.authEndpoint || Defaults.authEndpoint,
    authTransport: opts.authTransport || Defaults.authTransport,
    cluster: opts.cluster || Defaults.cluster,
    httpPath: opts.httpPath || Defaults.httpPath,
    httpPort: opts.httpPort || Defaults.httpPort,
    httpsPort: opts.httpsPort || Defaults.httpsPort,
    pongTimeout: opts.pongTimeout || Defaults.pongTimeout,
    statsHost: opts.statsHost || Defaults.stats_host,
    unavailableTimeout: opts.unavailableTimeout || Defaults.unavailableTimeout,
    wsPath: opts.wsPath || Defaults.wsPath,
    wsPort: opts.wsPort || Defaults.wsPort,
    wssPort: opts.wssPort || Defaults.wssPort,

    enableStats: getEnableStatsConfig(opts),
    httpHost: getHttpHost(opts),
    useTLS: shouldUseTLS(opts),
    wsHost: getWebsocketHost(opts)
  };

  if ('auth' in opts) config.auth = opts.auth;
  if ('authorizer' in opts) config.authorizer = opts.authorizer;
  if ('disabledTransports' in opts)
    config.disabledTransports = opts.disabledTransports;
  if ('enabledTransports' in opts)
    config.enabledTransports = opts.enabledTransports;
  if ('ignoreNullOrigin' in opts)
    config.ignoreNullOrigin = opts.ignoreNullOrigin;
  if ('timelineParams' in opts) config.timelineParams = opts.timelineParams;
  if ('nacl' in opts) {
    config.nacl = opts.nacl;
  }

  return config;
}

function getHttpHost(opts: Options): string {
  if (opts.httpHost) {
    return opts.httpHost;
  }
  if (opts.cluster) {
    return `sockjs-${opts.cluster}.pusher.com`;
  }
  return Defaults.httpHost;
}

function getWebsocketHost(opts: Options): string {
  if (opts.wsHost) {
    return opts.wsHost;
  }
  if (opts.cluster) {
    return getWebsocketHostFromCluster(opts.cluster);
  }
  return getWebsocketHostFromCluster(Defaults.cluster);
}

function getWebsocketHostFromCluster(cluster: string): string {
  return `ws-${cluster}.pusher.com`;
}

function shouldUseTLS(opts: Options): boolean {
  if (Runtime.getProtocol() === 'https:') {
    return true;
  } else if (opts.forceTLS === false) {
    return false;
  }
  return true;
}

// if enableStats is set take the value
// if disableStats is set take the inverse
// otherwise default to false
function getEnableStatsConfig(opts: Options): boolean {
  if ('enableStats' in opts) {
    return opts.enableStats;
  }
  if ('disableStats' in opts) {
    return !opts.disableStats;
  }
  return false;
}
