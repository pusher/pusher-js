import { Options } from './options';
import Defaults from './defaults';
import { AuthHandler, NewAuthOptions } from './auth/options';
import { UserAuthorizer } from './auth/user_authorizer';
import { ChannelAuthorizer } from './auth/channel_authorizer';
import { ChannelAuthorizerProxy } from './auth/deprecated_channel_authorizer';
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
  userAuthorizer: AuthHandler;
  channelAuthorizer: AuthHandler;

  // these are all optional parameters or overrrides. The customer can set these
  // but it's not strictly necessary
  forceTLS?: boolean;
  cluster?: string;
  disabledTransports?: Transport[];
  enabledTransports?: Transport[];
  ignoreNullOrigin?: boolean;
  nacl?: nacl;
  timelineParams?: any;
}

// getConfig mainly sets the defaults for the options that are not provided
export function getConfig(opts: Options, pusher): Config {
  let config: Config = {
    activityTimeout: opts.activityTimeout || Defaults.activityTimeout,
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
    wsHost: getWebsocketHost(opts),

    userAuthorizer: buildUserAuthorizer(opts),
    channelAuthorizer: buildChannelAuthorizer(opts, pusher)
  };

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

function buildUserAuthorizer(opts: Options): AuthHandler {
  const userAuth = opts.userAuth || Defaults.userAuth;
  if ('customHandler' in userAuth) {
    return userAuth['customHandler'];
  }

  return UserAuthorizer(userAuth);
}

function buildChannelAuth(opts: Options, pusher) {
  var channelAuth: NewAuthOptions;
  if ('channelAuth' in opts) {
    channelAuth = opts.channelAuth;
  } else {
    channelAuth = {
      transport: opts.authTransport || Defaults.authTransport,
      endpoint: opts.authEndpoint || Defaults.authEndpoint
    };
    if ('auth' in opts) {
      if ('params' in opts.auth) channelAuth.params = opts.auth.params;
      if ('headers' in opts.auth) channelAuth.headers = opts.auth.headers;
    }
    if ('authorizer' in opts)
      channelAuth.customHandler = ChannelAuthorizerProxy(
        pusher,
        channelAuth,
        opts.authorizer
      );
  }
  return channelAuth;
}

function buildChannelAuthorizer(opts: Options, pusher): AuthHandler {
  const channelAuth = buildChannelAuth(opts, pusher);
  if ('customHandler' in channelAuth) {
    return channelAuth['customHandler'];
  }

  return ChannelAuthorizer(channelAuth);
}
