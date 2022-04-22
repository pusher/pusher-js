import ConnectionManager from './connection/connection_manager';
import {
  AuthOptions,
  ChannelAuthorizationHandler,
  UserAuthenticationHandler
} from './auth/options';
import {
  ChannelAuthorizerGenerator,
  DeprecatedAuthOptions
} from './auth/deprecated_channel_authorizer';
import { AuthTransport, Transport } from './config';
import * as nacl from 'tweetnacl';

export interface Options {
  activityTimeout?: number;

  auth?: DeprecatedAuthOptions; // DEPRECATED use channelAuthorization instead
  authEndpoint?: string; // DEPRECATED use channelAuthorization instead
  authTransport?: AuthTransport; // DEPRECATED use channelAuthorization instead
  authorizer?: ChannelAuthorizerGenerator; // DEPRECATED use channelAuthorization instead

  channelAuthorization?: AuthOptions<ChannelAuthorizationHandler>;
  userAuthentication?: AuthOptions<UserAuthenticationHandler>;

  cluster?: string;
  enableStats?: boolean;
  disableStats?: boolean;
  disabledTransports?: Transport[];
  enabledTransports?: Transport[];
  forceTLS?: boolean;
  httpHost?: string;
  httpPath?: string;
  httpPort?: number;
  httpsPort?: number;
  ignoreNullOrigin?: boolean;
  nacl?: nacl;
  pongTimeout?: number;
  statsHost?: string;
  timelineParams?: any;
  unavailableTimeout?: number;
  wsHost?: string;
  wsPath?: string;
  wsPort?: number;
  wssPort?: number;
}
