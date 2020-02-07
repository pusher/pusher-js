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

export function getConfig(opts: Options): Config {
  let authTransport =
    opts.authTransport || (Defaults.channel_auth_transport as AuthTransport);

  let config: Config = {
    activityTimeout: opts.activityTimeout || Defaults.activity_timeout,
    authEndpoint: opts.authEndpoint || Defaults.channel_auth_endpoint,
    authTransport: authTransport,
    httpHost: getHttpHost(opts),
    httpPort: opts.httpPort || Defaults.sockjs_http_port,
    httpPath: opts.httpPath || Defaults.sockjs_path,
    httpsPort: opts.httpsPort || Defaults.sockjs_https_port,
    pongTimeout: opts.pongTimeout || Defaults.pong_timeout,
    statsHost: opts.statsHost || Defaults.stats_host,
    unavailableTimeout: opts.unavailableTimeout || Defaults.unavailable_timeout,
    wsHost: getWebsocketHost(opts),
    wsPath: opts.wsPath || Defaults.ws_path,
    wsPort: opts.wsPort || Defaults.ws_port,
    wssPort: opts.wssPort || Defaults.wss_port,
    useTLS: shouldUseTLS()
  };
  return config;
}

export interface Config {
  // these are all 'required' config parameters, it's not necessary for the user
  // to set them, but they have configured defaults.
  activityTimeout: number;
  authEndpoint: string;
  authTransport: AuthTransport;
  httpPath: string;
  httpHost: string;
  httpPort: number;
  httpsPort: number;
  pongTimeout: number;
  statsHost: string;
  unavailableTimeout: number;
  wsHost: string;
  wsPath: string;
  wsPort: number;
  wssPort: number;
  useTLS: boolean;

  // these are all optional parameters or overrrides. The customer can set these
  // but it's not strictly necessary
  auth?: AuthOptions;
  authorizer?: AuthorizerGenerator;
  cluster?: string;
  disableStats?: boolean;
  disabledTransports?: Transport[];
  enabledTransports?: Transport[];
  encrypted?: boolean;
  forceTLS?: boolean;
  ignoreNullOrigin?: boolean;
  timelineParams?: any;
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
    return `ws-${opts.cluster}.pusher.com`;
  }
  return Defaults.host;
}

function shouldUseTLS(): boolean {
  if (Runtime.getProtocol() === 'https:') {
    return true;
  } else if (this.config.forceTLS === true) {
    return true;
  } else {
    // `encrypted` deprecated in favor of `forceTLS`
    return Boolean(this.config.encrypted);
  }
}
