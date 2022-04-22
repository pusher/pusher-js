import { Options } from './options';
import Defaults from './defaults';
import {
  ChannelAuthorizationHandler,
  UserAuthenticationHandler,
  AuthOptions
} from './auth/options';
import UserAuthenticator from './auth/user_authenticator';
import ChannelAuthorizer from './auth/channel_authorizer';
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
  userAuthenticator: UserAuthenticationHandler;
  channelAuthorizer: ChannelAuthorizationHandler;

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

    userAuthenticator: buildUserAuthenticator(opts),
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

function buildUserAuthenticator(opts: Options): UserAuthenticationHandler {
  const userAuthentication = {
    ...Defaults.userAuthentication,
    ...opts.userAuthentication
  };
  if (
    'customHandler' in userAuthentication &&
    userAuthentication['customHandler'] != null
  ) {
    return userAuthentication['customHandler'];
  }

  return UserAuthenticator(userAuthentication);
}

function buildChannelAuth(
  opts: Options,
  pusher
): AuthOptions<ChannelAuthorizationHandler> {
  let channelAuthorization: AuthOptions<ChannelAuthorizationHandler>;
  if ('channelAuthorization' in opts) {
    channelAuthorization = {
      ...Defaults.channelAuthorization,
      ...opts.channelAuthorization
    };
  } else {
    channelAuthorization = {
      transport: opts.authTransport || Defaults.authTransport,
      endpoint: opts.authEndpoint || Defaults.authEndpoint
    };
    if ('auth' in opts) {
      if ('params' in opts.auth) channelAuthorization.params = opts.auth.params;
      if ('headers' in opts.auth)
        channelAuthorization.headers = opts.auth.headers;
    }
    if ('authorizer' in opts)
      channelAuthorization.customHandler = ChannelAuthorizerProxy(
        pusher,
        channelAuthorization,
        opts.authorizer
      );
  }
  return channelAuthorization;
}

function buildChannelAuthorizer(
  opts: Options,
  pusher
): ChannelAuthorizationHandler {
  const channelAuthorization = buildChannelAuth(opts, pusher);
  if (
    'customHandler' in channelAuthorization &&
    channelAuthorization['customHandler'] != null
  ) {
    return channelAuthorization['customHandler'];
  }

  return ChannelAuthorizer(channelAuthorization);
}
