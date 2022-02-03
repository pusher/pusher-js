import ConnectionManager from './connection/connection_manager';
import { NewAuthOptions } from './auth/options';
import {
  ChannelAuthorizerGenerator,
  OldAuthOptions
} from './auth/deprecated_channel_authorizer';
import { AuthTransport, Transport } from './config';
import * as nacl from 'tweetnacl';

export interface Options {
  activityTimeout?: number;

  auth?: OldAuthOptions; // DEPRECATED use channelAuth instead
  authEndpoint?: string; // DEPRECATED use channelAuth instead
  authTransport?: AuthTransport; // DEPRECATED use channelAuth instead
  authorizer?: ChannelAuthorizerGenerator; // DEPRECATED use channelAuth instead

  channelAuth?: NewAuthOptions;
  userAuth?: NewAuthOptions;

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
