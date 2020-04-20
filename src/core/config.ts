import { Options } from './options';
import Defaults from './defaults';
import { AuthOptions, AuthorizerGenerator } from './auth/options';
import Runtime from 'runtime';

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
  timelineParams?: any;
}

export function getConfig(opts: Options): Config {
  let authTransport =
    opts.authTransport || (Defaults.channel_auth_transport as AuthTransport);

  let config: Config = {
    activityTimeout: opts.activityTimeout || Defaults.activity_timeout,
    authEndpoint: opts.authEndpoint || Defaults.channel_auth_endpoint,
    authTransport: authTransport,
    cluster: opts.cluster || Defaults.cluster,
    enableStats: getEnableStatsConfig(opts),
    httpHost: getHttpHost(opts),
    httpPath: opts.httpPath || Defaults.sockjs_path,
    httpPort: opts.httpPort || Defaults.sockjs_http_port,
    httpsPort: opts.httpsPort || Defaults.sockjs_https_port,
    pongTimeout: opts.pongTimeout || Defaults.pong_timeout,
    statsHost: opts.statsHost || Defaults.stats_host,
    unavailableTimeout: opts.unavailableTimeout || Defaults.unavailable_timeout,
    useTLS: shouldUseTLS(opts),
    wsHost: getWebsocketHost(opts),
    wsPath: opts.wsPath || Defaults.ws_path,
    wsPort: opts.wsPort || Defaults.ws_port,
    wssPort: opts.wssPort || Defaults.wss_port,

    auth: opts.auth || undefined,
    authorizer: opts.authorizer || undefined,
    disabledTransports: opts.disabledTransports || undefined,
    enabledTransports: opts.enabledTransports || undefined,
    ignoreNullOrigin: opts.ignoreNullOrigin || undefined,
    timelineParams: opts.timelineParams || undefined
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

  return config;
}

function getHttpHost(opts: Options): string {
  if (opts.httpHost) {
    return opts.httpHost;
  }
  if (opts.cluster) {
    return `sockjs-${opts.cluster}.pusher.com`;
  }
  return Defaults.sockjs_host;
}

function getWebsocketHost(opts: Options): string {
  if (opts.wsHost) {
    return opts.wsHost;
  }
  if (opts.cluster) {
    return getWebsocketHostFromCluster(opts.cluster)
  }
  return getWebsocketHostFromCluster(Defaults.cluster)
}

function getWebsocketHostFromCluster(cluster: string): string {
    return `ws-${cluster}.pusher.com`;
}

function shouldUseTLS(opts: Options): boolean {
  if (Runtime.getProtocol() === 'https:') {
    return true;
  } else if (opts.forceTLS === true) {
    return true;
  } else {
    // `encrypted` deprecated in favor of `forceTLS`
    return Boolean(opts.encrypted);
  }
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
